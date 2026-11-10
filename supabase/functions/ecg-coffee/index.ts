import { authenticatedClients, options, reply } from '../_shared/ecg.ts';
import { parseCoffeeInput } from '../_shared/coffee-input.ts';

Deno.serve(async (request) => {
  const preflight = options(request);
  if (preflight) return preflight;
  if (request.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405);
  const clients = await authenticatedClients(request);
  if (!clients) return reply({ error: 'unauthorized' }, 401);
  const raw = await request.text();
  if (raw.length > 4096) return reply({ error: 'invalid_input' }, 400);
  let input: unknown;
  try { input = JSON.parse(raw); } catch { return reply({ error: 'invalid_input' }, 400); }
  const data = parseCoffeeInput(input);
  if (!data) return reply({ error: 'invalid_input' }, 400);
  const { data: binding, error } = await clients.admin.from('ecg_participant_bindings')
    .select('ecg_person_id,credential_revision,revoked_at,access_type,seat_label,committees!inner(abbreviation)')
    .eq('conference_id', data.conferenceId).eq('user_id', clients.userId).maybeSingle();
  if (error) return reply({ error: 'unavailable' }, 503);
  if (!binding || binding.revoked_at || !['member', 'chair'].includes(binding.access_type))
    return reply({ error: 'unbound' }, 401);
  const committee = Array.isArray(binding.committees) ? binding.committees[0] : binding.committees;
  if (!committee?.abbreviation) return reply({ error: 'unbound' }, 401);
  const identity = { personId: binding.ecg_person_id, revision: binding.credential_revision,
    kind: binding.access_type === 'member' ? 'delegate' : 'chair', committee: committee.abbreviation,
    seat: binding.seat_label };
  const base = Deno.env.get('ECG_INTEGRATION_URL');
  const key = Deno.env.get('ECG_INTEGRATION_KEY');
  if (!base?.startsWith('https://') || !key || key.length < 32) return reply({ error: 'unavailable' }, 503);
  let response: Response;
  let body: Record<string, unknown>;
  try {
    const { conferenceId: _conferenceId, ...action } = data;
    response = await fetch(new URL('/api/integration/participant', base), {
      method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/json', 'X-Kamun-Integration-Key': key },
      body: JSON.stringify({ ...action, identity }), signal: AbortSignal.timeout(10_000),
    });
    body = await response.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('invalid_response');
  } catch { return reply({ error: 'unavailable' }, 503); }
  const returnedIdentity = body.identity as Record<string, unknown> | undefined;
  const changed = returnedIdentity && Object.entries(identity).some(([key, value]) => returnedIdentity[key] !== value);
  if (response.status === 401 || changed) {
    await clients.admin.rpc('ecg_revoke_verified_identity', {
      p_conference_id: data.conferenceId, p_ecg_person_id: binding.ecg_person_id,
      p_credential_revision: binding.credential_revision,
    });
    return reply({ error: 'revoked' }, 401);
  }
  if (response.status === 410 && body.error === 'data_purged') return reply({ error: 'data_purged' }, 410);
  // Only errors defined by the existing order engine are exposed to the participant.
  const businessErrors = ['invalid_input', 'note_too_long', 'unassigned', 'ordering_closed', 'queue_closed', 'round_full',
    'chairs_paused', 'limit_reached', 'daily_limit_reached', 'rate_limited', 'item_unavailable', 'option_invalid',
    'option_unavailable', 'fulfilment_required', 'conflict', 'not_cancellable'];
  if (!response.ok) return returnedIdentity && typeof body.error === 'string' && businessErrors.includes(body.error)
    ? reply({ error: body.error }, response.status === 400 ? 400 : 409) : reply({ error: 'unavailable' }, 503);
  if (!returnedIdentity || !body.result || typeof body.result !== 'object') return reply({ error: 'unavailable' }, 503);
  const { data: refreshed, error: refreshError } = await clients.admin.rpc('ecg_refresh_verified_identity', {
    p_conference_id: data.conferenceId, p_user_id: clients.userId,
    p_ecg_person_id: binding.ecg_person_id, p_credential_revision: binding.credential_revision,
  });
  if (refreshError || !refreshed) return reply({ error: 'unbound' }, 401);
  return reply(body.result as object, response.status);
});
