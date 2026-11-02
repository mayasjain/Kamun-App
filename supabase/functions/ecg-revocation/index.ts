import { createClient } from 'npm:@supabase/supabase-js@2';

const respond = (status: number) => new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });

Deno.serve(async (request) => {
  if (request.method !== 'POST') return respond(405);
  const secret = Deno.env.get('ECG_INTEGRATION_KEY');
  const supplied = request.headers.get('X-Kamun-Integration-Key');
  if (!secret || secret.length < 32 || !supplied) return respond(404);
  const encode = (value: string) => new TextEncoder().encode(value);
  const [left, right] = await Promise.all([
    crypto.subtle.digest('SHA-256', encode(secret)),
    crypto.subtle.digest('SHA-256', encode(supplied)),
  ]);
  let different = 0;
  const a = new Uint8Array(left), b = new Uint8Array(right);
  for (let i = 0; i < a.length; i++) different |= a[i] ^ b[i];
  if (different) return respond(404);
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') || '')) return respond(400);
  const raw = await request.text();
  if (raw.length > 256) return respond(400);
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return respond(400); }
  const data = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  if (!Number.isSafeInteger(data.personId) || Number(data.personId) < 1
    || typeof data.revision !== 'string' || !/^[a-f0-9]{64}$/.test(data.revision)) return respond(400);
  const url = Deno.env.get('SUPABASE_URL');
  let key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) {
    try { key = (JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}') as Record<string,string>).default; }
    catch { return respond(503); }
  }
  if (!url || !key) return respond(503);
  const admin = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await admin.rpc('ecg_revoke_verified_identity_all', {
    p_ecg_person_id: data.personId,
    p_credential_revision: data.revision,
  });
  return respond(error ? 503 : 204);
});
