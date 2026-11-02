import { authenticatedClients, ecgLogoutRequest, ecgSessionScope, options, reply } from '../_shared/ecg.ts';

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
  // Block new handoffs first. Retrying this endpoint remains possible with the same Auth session.
  const { error } = await clients.admin.from('ecg_participant_bindings')
    .update({ revoked_at: new Date().toISOString() })
    .eq('conference_id', data.conferenceId).eq('user_id', clients.userId);
  if (error) return reply({ error: 'unavailable' }, 503);
  const scope = await ecgSessionScope(clients.userId, data.conferenceId);
  if (!(await ecgLogoutRequest(scope))) return reply({ error: 'unavailable' }, 503);
  return reply({ ok: true });
});
