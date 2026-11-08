import { authenticatedClients, ecgRequest, ecgLogoutRequest, ecgSessionScope, options, reply } from '../_shared/ecg.ts';

Deno.serve(async (request) => {
  const preflight = options(request);
  if (preflight) return preflight;
  if (request.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405);
  const clients = await authenticatedClients(request);
  if (!clients) return reply({ error: 'unauthorized' }, 401);
  const { data: allowed, error: limitError } = await clients.admin.rpc('ecg_acquire_claim_attempt', {
    p_user_id: clients.userId,
  });
  if (limitError) return reply({ error: 'unavailable' }, 503);
  if (!allowed) return reply({ error: 'rate_limited' }, 429);
  let input: unknown;
  try { input = await request.json(); } catch { return reply({ error: 'invalid_input' }, 400); }
  const data = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  if (typeof data.code !== 'string' || data.code.length < 4 || data.code.length > 20
    || typeof data.conferenceId !== 'string' || !/^[0-9a-f-]{36}$/i.test(data.conferenceId))
    return reply({ error: 'invalid_input' }, 400);
  const result = await ecgRequest({ action: 'verify', code: data.code });
  if (result.status !== 200 || !result.identity)
    return reply({ error: result.status === 401 ? 'invalid_code' : 'unavailable' }, result.status);
  const identity = result.identity;
  const { error: adminRevokeError } = await clients.admin.rpc('ecg_clear_linked_admin', {
    p_conference_id: data.conferenceId, p_user_id: clients.userId,
  });
  if (adminRevokeError) return reply({ error: 'unavailable' }, 503);
  // A successful code change must not leave the previous ECE account signed in.
  const { error: revokeError } = await clients.admin.from('ecg_participant_bindings')
    .update({ revoked_at: new Date().toISOString() })
    .eq('conference_id', data.conferenceId).eq('user_id', clients.userId);
  if (revokeError || !(await ecgLogoutRequest(await ecgSessionScope(clients.userId, data.conferenceId))))
    return reply({ error: 'unavailable' }, 503);
  if (identity.kind === 'kamun_admin') {
    const { data: membership, error } = await clients.admin.rpc('ecg_bind_verified_admin', {
      p_conference_id: data.conferenceId, p_user_id: clients.userId,
      p_ecg_person_id: identity.personId, p_credential_revision: identity.revision,
      p_session_scope: await ecgSessionScope(clients.userId, data.conferenceId),
    });
    if (error) return reply({ error: 'identity_unavailable' }, 409);
    return reply({ membership: membership?.[0] });
  }
  const { data: membership, error } = await clients.admin.rpc('ecg_bind_verified_identity', {
    p_conference_id: data.conferenceId,
    p_user_id: clients.userId,
    p_ecg_person_id: identity.personId,
    p_kind: identity.kind,
    p_committee_abbreviation: identity.committee,
    p_seat_label: identity.seat,
    p_credential_revision: identity.revision,
  });
  if (error) return reply({ error: 'identity_unavailable' }, 409);
  return reply({ membership: membership?.[0] });
});
