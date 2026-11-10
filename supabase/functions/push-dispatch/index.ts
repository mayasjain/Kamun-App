import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
import { ecgRequest, secretKey, reply } from '../_shared/ecg.ts';
import { identityMatches, validPushEndpoint, validPushKeys } from '../_shared/web-push.ts';

Deno.serve(async (request) => {
  if (request.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405);
  const expected = Deno.env.get('WEB_PUSH_DISPATCH_KEY');
  const supplied = request.headers.get('X-Push-Dispatch-Key');
  if (!expected || !supplied) return reply({ error: 'unauthorized' }, 401);
  const digest = async (value: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
  const a = await digest(expected), b = await digest(supplied);
  if (a.reduce((diff, byte, i) => diff | (byte ^ b[i]), 0)) return reply({ error: 'unauthorized' }, 401);
  const publicKey = Deno.env.get('WEB_PUSH_PUBLIC_KEY'), privateKey = Deno.env.get('WEB_PUSH_PRIVATE_KEY');
  const service = secretKey(), url = Deno.env.get('SUPABASE_URL');
  if (!publicKey || !privateKey || !service || !url) return reply({ error: 'unavailable' }, 503);
  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { data: jobs, error } = await admin.rpc('web_push_claim', { p_limit: 64 });
  if (error) return reply({ error: 'unavailable' }, 503);
  const identities = new Map<string, ReturnType<typeof ecgRequest>>();
  let sent = 0, deferred = 0;
  const deliver = async (job: Record<string, any>) => {
    let state = 'skipped', http: number | null = null;
    try {
      const { data: eligible, error } = await admin.rpc('web_push_eligible', { p_subscription: job.subscription_id, p_announcement: job.announcement_id });
      if (error) throw new Error('database');
      if (eligible && validPushEndpoint(job.endpoint) && validPushKeys(job)) {
        const key = `${job.person_id}:${job.revision}`;
        if (!identities.has(key)) identities.set(key, ecgRequest({ action: 'status', personId: job.person_id, revision: job.revision }));
        const result = await identities.get(key)!;
        if (result.status === 503) throw new Error('authority_unavailable');
        if (result.status === 200 && result.identity && identityMatches(job, result.identity)) {
          // Recheck after the network round trip; logout/switch/removal may have occurred.
          const latest = await admin.rpc('web_push_eligible', { p_subscription: job.subscription_id, p_announcement: job.announcement_id });
          if (latest.error) throw new Error('database');
          if (latest.data) {
            await webpush.sendNotification({ endpoint: job.endpoint, keys: { p256dh: job.p256dh, auth: job.auth } },
              JSON.stringify({ tag: `kamun-${job.announcement_id}` }), {
                vapidDetails: { subject: 'https://kamun-2026-app.pages.dev', publicKey, privateKey },
                TTL: 300, urgency: 'high', timeout: 8000,
              });
            state = 'sent'; sent++;
          }
        }
      }
    } catch (cause) {
      // Never log provider errors: they can include endpoint credentials/payloads.
      const status = (cause as { statusCode?: number })?.statusCode;
      http = typeof status === 'number' ? status : null;
      if (status === 404 || status === 410) {
        const result = await admin.from('web_push_subscriptions').update({ enabled: false }).eq('id', job.subscription_id);
        state = result.error ? 'pending' : 'skipped';
      } else if (status === 400 || status === 413) state = 'failed';
      else { state = 'pending'; deferred++; }
    }
    const result = await admin.rpc('web_push_finish', { p_delivery: job.delivery_id, p_lease: job.lease_id, p_state: state, p_http: http });
    if (result.error) deferred++; // Lease expiry safely retries failed acknowledgements.
  };
  // Bound network fanout and finish well within the function runtime limit.
  const queue = [...(jobs ?? [])];
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (queue.length) await deliver(queue.shift()!);
  }));
  // Continue a larger audience promptly; leases also make cron overlap safe.
  if ((jobs?.length ?? 0) === 64) await admin.rpc('web_push_wake');
  return reply({ sent, deferred });
});
