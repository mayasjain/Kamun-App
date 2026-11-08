import { authenticatedClients, ecgRequest, ecgSessionScope, options, reply } from '../_shared/ecg.ts';

Deno.serve(async (request) => {
  const preflight = options(request);
  if (preflight) return preflight;
  if (request.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405);
  const clients = await authenticatedClients(request);
  if (!clients) return reply({ error: 'unauthorized' }, 401);
  let input: unknown;
  try { input = await request.json(); } catch { return reply({ error: 'invalid_input' }, 400); }
  const data = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  if (typeof data.conferenceId !== 'string' || !/^[0-9a-f-]{36}$/i.test(data.conferenceId))
    return reply({ error: 'invalid_input' }, 400);
  const { data: adminBinding, error: adminError } = await clients.admin.from('ecg_admin_bindings')
    .select('ecg_person_id,credential_revision,revoked_at,session_scope')
    .eq('conference_id', data.conferenceId).eq('user_id', clients.userId).maybeSingle();
  if (adminError) return reply({ error: 'unavailable' }, 503);
  if (adminBinding && !adminBinding.revoked_at) {
    const scope = await ecgSessionScope(clients.userId, data.conferenceId);
    const result = await ecgRequest({ action: 'status', personId: adminBinding.ecg_person_id, revision: adminBinding.credential_revision });
    if (result.status !== 200 || result.identity?.kind !== 'kamun_admin'
      || result.identity.personId !== adminBinding.ecg_person_id
      || result.identity.revision !== adminBinding.credential_revision || scope !== adminBinding.session_scope) {
      await clients.admin.rpc('ecg_clear_linked_admin', { p_conference_id: data.conferenceId, p_user_id: clients.userId });
      return reply({ error: 'revoked' }, 401);
    }
    const { data: refreshed, error } = await clients.admin.rpc('ecg_refresh_verified_admin', {
      p_conference_id: data.conferenceId, p_user_id: clients.userId,
      p_ecg_person_id: adminBinding.ecg_person_id, p_credential_revision: adminBinding.credential_revision,
      p_session_scope: scope,
    });
    return error || !refreshed ? reply({ error: 'unbound' }, 401) : reply({ validForSeconds: 300 });
  }
  const { data: binding, error } = await clients.admin.from('ecg_participant_bindings')
    .select('ecg_person_id,credential_revision,revoked_at,access_type,seat_label,committees!inner(abbreviation)').eq('conference_id', data.conferenceId)
    .eq('user_id', clients.userId).maybeSingle();
  if (error) return reply({ error: 'unavailable' }, 503);
  if (!binding || binding.revoked_at) return reply({ error: 'unbound' }, 401);
  const result = await ecgRequest({ action: 'status', personId: binding.ecg_person_id,
    revision: binding.credential_revision });
  const committee = Array.isArray(binding.committees) ? binding.committees[0] : binding.committees;
  const changed = result.identity && (result.identity.personId !== binding.ecg_person_id
    || result.identity.revision !== binding.credential_revision
    || result.identity.committee !== committee?.abbreviation
    || result.identity.seat !== binding.seat_label
    || (result.identity.kind === 'delegate' ? 'member' : 'chair') !== binding.access_type);
  if (result.status === 401 || changed) {
    await clients.admin.rpc('ecg_revoke_verified_identity', {
      p_conference_id: data.conferenceId, p_ecg_person_id: binding.ecg_person_id,
      p_credential_revision: binding.credential_revision,
    });
    return reply({ error: 'revoked' }, 401);
  }
  if (result.status !== 200) return reply({ error: 'unavailable' }, 503);
  const { data: refreshed, error: refreshError } = await clients.admin.rpc('ecg_refresh_verified_identity', {
    p_conference_id: data.conferenceId, p_user_id: clients.userId,
    p_ecg_person_id: binding.ecg_person_id, p_credential_revision: binding.credential_revision,
  });
  if (refreshError || !refreshed) return reply({ error: 'unbound' }, 401);
  return reply({ validForSeconds: 300 });
});
