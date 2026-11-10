import { authenticatedClients, options, reply } from '../_shared/ecg.ts';
import { validPushEndpoint, validPushKeys } from '../_shared/web-push.ts';

Deno.serve(async (request) => {
  const preflight = options(request); if (preflight) return preflight;
  if (request.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405);
  const clients = await authenticatedClients(request);
  if (!clients) return reply({ error: 'unauthorized' }, 401);
  let body;
  try { body = await request.json(); } catch { return reply({ error: 'invalid_input' }, 400); }
  if (!body || typeof body !== 'object') return reply({ error: 'invalid_input' }, 400);
  if (body.action === 'config') {
    const publicKey = Deno.env.get('WEB_PUSH_PUBLIC_KEY');
    return publicKey ? reply({ publicKey }) : reply({ error: 'unavailable' }, 503);
  }
  if (!validPushEndpoint(body.endpoint)) return reply({ error: 'invalid_input' }, 400);
  if (body.action === 'status') {
    const { data, error } = await clients.admin.from('web_push_subscriptions').select('enabled')
      .eq('endpoint', body.endpoint).eq('user_id', clients.userId).maybeSingle();
    return error ? reply({ error: 'unavailable' }, 503) : reply({ enabled: data?.enabled === true });
  }
  if (body.action === 'unsubscribe') {
    const { error } = await clients.admin.from('web_push_subscriptions').update({ enabled: false })
      .eq('endpoint', body.endpoint).eq('user_id', clients.userId);
    return error ? reply({ error: 'unavailable' }, 503) : reply({ ok: true });
  }
  if (body.action !== 'subscribe' || !validPushKeys(body.keys)
    || typeof body.conferenceId !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.conferenceId))
    return reply({ error: 'invalid_input' }, 400);
  const { error } = await clients.admin.rpc('web_push_register', {
    p_user: clients.userId, p_conference: body.conferenceId, p_endpoint: body.endpoint,
    p_p256dh: body.keys.p256dh, p_auth: body.keys.auth,
  });
  return error ? reply({ error: error.code === '42501' ? 'unauthorized' : 'unavailable' }, error.code === '42501' ? 403 : 503)
    : reply({ ok: true });
});
