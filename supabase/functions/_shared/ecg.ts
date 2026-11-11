import { createClient } from 'npm:@supabase/supabase-js@2';

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function reply(body: object, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

export function options(request: Request) {
  return request.method === 'OPTIONS' ? new Response(null, { status: 204, headers: jsonHeaders }) : null;
}

export function secretKey() {
  const modern = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (modern) {
    try { return (JSON.parse(modern) as Record<string, string>).default; } catch { /* Invalid configuration. */ }
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
}

export async function authenticatedClients(request: Request) {
  const url = Deno.env.get('SUPABASE_URL');
  const publishable = Deno.env.get('SUPABASE_ANON_KEY') || (() => {
    try { return (JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || '{}') as Record<string, string>).default; }
    catch { return undefined; }
  })();
  const secret = secretKey();
  const token = /^Bearer (.+)$/i.exec(request.headers.get('Authorization') || '')?.[1];
  if (!url || !publishable || !secret || !token) return null;
  const publicClient = createClient(url, publishable, { auth: { persistSession: false } });
  const { data, error } = await publicClient.auth.getUser(token);
  if (error || !data.user) return null;
  const admin = createClient(url, secret, { auth: { persistSession: false } });
  return { userId: data.user.id, admin };
}

export type EcgParticipantIdentity = {
  personId: number;
  kind: 'delegate' | 'chair';
  committee: string;
  seat: string | null;
  revision: string;
};

export type EcgIdentity = EcgParticipantIdentity | { personId: number; kind: 'faculty_adviser' | 'observer'; committee: null; seat: null; revision: string } | { personId: number; kind: 'kamun_admin'; committee: null; seat: null; revision: string };

function isIdentity(value: unknown): value is EcgIdentity {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (!Number.isSafeInteger(v.personId) || Number(v.personId) <= 0
    || typeof v.revision !== 'string' || !/^[a-f0-9]{64}$/.test(v.revision)) return false;
  if (['kamun_admin','faculty_adviser','observer'].includes(String(v.kind))) return v.committee === null && v.seat === null;
  return (v.kind === 'delegate' || v.kind === 'chair')
    && typeof v.committee === 'string' && /^[A-Za-z0-9-]{1,20}$/.test(v.committee)
    && (v.kind === 'chair' ? v.seat === null : typeof v.seat === 'string' && v.seat.length <= 100);
}

export async function ecgRequest(body: object): Promise<{ status: number; identity?: EcgIdentity }> {
  const base = Deno.env.get('ECG_INTEGRATION_URL');
  const key = Deno.env.get('ECG_INTEGRATION_KEY');
  if (!base || !base.startsWith('https://') || !key || key.length < 32) return { status: 503 };
  try {
    const response = await fetch(new URL('/api/integration/identity', base), {
      method: 'POST', redirect: 'error',
      headers: { 'Content-Type': 'application/json', 'X-Kamun-Integration-Key': key },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    if (response.status === 401) return { status: 401 };
    if (!response.ok) return { status: 503 };
    const value: unknown = await response.json();
    return isIdentity(value) ? { status: 200, identity: value } : { status: 503 };
  } catch { return { status: 503 }; }
}

export async function ecgSessionScope(userId: string, conferenceId: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(
    `${Deno.env.get('SUPABASE_URL')}|${conferenceId}|${userId}`,
  ));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function ecgLogoutRequest(scope: string): Promise<boolean> {
  const base = Deno.env.get('ECG_INTEGRATION_URL');
  const key = Deno.env.get('ECG_INTEGRATION_KEY');
  if (!base || !key || key.length < 32) return false;
  try {
    const site = new URL(base);
    if (site.protocol !== 'https:' || site.username || site.password) return false;
    const response = await fetch(new URL('/api/integration/identity', site), {
      method: 'POST', redirect: 'error',
      headers: { 'Content-Type': 'application/json', 'X-Kamun-Integration-Key': key },
      body: JSON.stringify({ action: 'logout', scope }), signal: AbortSignal.timeout(5000),
    });
    return response.ok && (await response.json())?.ok === true;
  } catch { return false; }
}

export async function ecgHandoffRequest(personId: number, revision: string, scope: string): Promise<{
  status: number; identity?: EcgIdentity; url?: string;
}> {
  const base = Deno.env.get('ECG_INTEGRATION_URL');
  const key = Deno.env.get('ECG_INTEGRATION_KEY');
  if (!base || !key || key.length < 32) return { status: 503 };
  let site: URL;
  try {
    site = new URL(base);
    if (site.protocol !== 'https:' || site.username || site.password || site.search || site.hash)
      return { status: 503 };
  } catch { return { status: 503 }; }
  try {
    const response = await fetch(new URL('/api/integration/identity', site), {
      method: 'POST', redirect: 'error',
      headers: { 'Content-Type': 'application/json', 'X-Kamun-Integration-Key': key },
      body: JSON.stringify({ action: 'ticket', personId, revision, scope }),
      signal: AbortSignal.timeout(5000),
    });
    if (response.status === 401) return { status: 401 };
    if (!response.ok) return { status: 503 };
    const value: unknown = await response.json();
    if (!value || typeof value !== 'object') return { status: 503 };
    const data = value as Record<string, unknown>;
    if (!isIdentity(data.identity) || !['delegate','chair'].includes(data.identity.kind) || typeof data.ticket !== 'string'
      || !/^[A-Za-z0-9_-]{43}$/.test(data.ticket)) return { status: 503 };
    const url = new URL('/', site);
    url.hash = `handoff=${data.ticket}`;
    return { status: 200, identity: data.identity, url: url.toString() };
  } catch { return { status: 503 }; }
}
