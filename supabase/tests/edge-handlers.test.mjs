import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
import ts from '../../apps/mobile/node_modules/typescript/lib/typescript.js';

const root = new URL('../functions/', import.meta.url);
const dir = mkdtempSync(join(tmpdir(), 'ecg-edge-test-'));
mkdirSync(join(dir, '_shared'));
for (const name of ['ecg-claim', 'ecg-refresh', 'ecg-revocation', 'ecg-handoff', 'ecg-logout']) mkdirSync(join(dir, name));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}');
writeFileSync(join(dir, 'supabase-stub.js'),
  'export const createClient = (...args) => globalThis.__createSupabaseClient(...args);');

for (const [source, output] of [
  ['_shared/ecg.ts', '_shared/ecg.js'],
  ['ecg-claim/index.ts', 'ecg-claim/index.js'],
  ['ecg-refresh/index.ts', 'ecg-refresh/index.js'],
  ['ecg-revocation/index.ts', 'ecg-revocation/index.js'],
  ['ecg-handoff/index.ts', 'ecg-handoff/index.js'],
  ['ecg-logout/index.ts', 'ecg-logout/index.js'],
]) {
  const input = readFileSync(new URL(source, root), 'utf8')
    .replaceAll('npm:@supabase/supabase-js@2', '../supabase-stub.js')
    .replaceAll('../_shared/ecg.ts', '../_shared/ecg.js');
  const js = ts.transpileModule(input, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
  writeFileSync(join(dir, output), js);
}

const env = new Map([
  ['SUPABASE_URL', 'https://example.supabase.co'],
  ['SUPABASE_ANON_KEY', 'public-test-key'],
  ['SUPABASE_SERVICE_ROLE_KEY', 'secret-test-key'],
  ['ECG_INTEGRATION_URL', 'https://cafe.example.test'],
  ['ECG_INTEGRATION_KEY', 'separate-test-secret-at-least-32-chars-long'],
]);
const handlers = {};
globalThis.Deno = {
  env: { get: (name) => env.get(name) },
  serve: (handler) => { handlers[globalThis.__loadingHandler] = handler; },
};
for (const name of ['ecg-claim', 'ecg-refresh', 'ecg-revocation', 'ecg-handoff', 'ecg-logout']) {
  globalThis.__loadingHandler = name;
  await import(pathToFileURL(join(dir, name, 'index.js')).href);
}

const identity = {
  personId: 101, kind: 'delegate', committee: 'ILO', seat: 'France', revision: 'a'.repeat(64),
};
const conferenceId = '10000000-0000-4000-8000-000000000001';
const request = (body, headers = {}) => new Request('https://functions.example.test/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer valid-user', ...headers },
  body: JSON.stringify(body),
});

test('ECG functions allow the browser Supabase client preflight', async () => {
  const response = await handlers['ecg-claim'](new Request('https://functions.example.test/', {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:19006',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'authorization,apikey,content-type,x-client-info',
    },
  }));
  assert.equal(response.status, 204);
  const allowed = response.headers.get('Access-Control-Allow-Headers')?.toLowerCase().split(/,\s*/);
  for (const header of ['authorization', 'apikey', 'content-type', 'x-client-info']) {
    assert.ok(allowed?.includes(header), `${header} must be allowed`);
  }
});

test('claim authenticates, rate-limits, and binds only the ECG-derived seat', async () => {
  let bindArgs;
  let allowed = true;
  globalThis.__createSupabaseClient = (_url, key) => key === 'public-test-key'
    ? { auth: { getUser: async (token) => token === 'valid-user'
      ? { data: { user: { id: 'user-1' } }, error: null }
      : { data: { user: null }, error: new Error('bad token') } } }
    : { from: () => ({ update: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }) }),
      rpc: async (name, args) => {
      if (name === 'ecg_acquire_claim_attempt') return { data: allowed, error: null };
      bindArgs = args;
      return { data: [{ committee_name: 'ILO', seat_label: 'France' }], error: null };
    } };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(new URL(_url).pathname, '/api/integration/identity');
    assert.equal(options.headers['X-Kamun-Integration-Key'], env.get('ECG_INTEGRATION_KEY'));
    if (body.action === 'verify') assert.equal(body.code, 'a1b2c');
    return new Response(JSON.stringify(body.action === 'logout' ? { ok: true } : identity), { status: 200 });
  };
  try {
    const success = await handlers['ecg-claim'](request({ code: 'a1b2c', conferenceId }));
    assert.equal(success.status, 200);
    assert.deepEqual(bindArgs, {
      p_conference_id: conferenceId, p_user_id: 'user-1', p_ecg_person_id: 101,
      p_kind: 'delegate', p_committee_abbreviation: 'ILO', p_seat_label: 'France',
      p_credential_revision: 'a'.repeat(64),
    });
    assert.equal((await success.text()).includes('a1b2c'), false);
    assert.equal((await handlers['ecg-claim'](request({ code: 'TESTCODE', conferenceId },
      { Authorization: 'Bearer invalid' }))).status, 401);
    allowed = false;
    assert.equal((await handlers['ecg-claim'](request({ code: 'TESTCODE', conferenceId }))).status, 429);
  } finally { globalThis.fetch = originalFetch; }
});

test('refresh rejects a changed seat and revokes its old revision', async () => {
  const calls = [];
  globalThis.__createSupabaseClient = (_url, key) => key === 'public-test-key'
    ? { auth: { getUser: async (token) => token === 'valid-user'
      ? { data: { user: { id: 'user-1' } }, error: null }
      : { data: { user: null }, error: new Error('bad token') } } }
    : {
      from: (table) => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({
        data: table === 'ecg_admin_bindings' ? null : { ecg_person_id: 101, credential_revision: 'a'.repeat(64), revoked_at: null,
          access_type: 'member', seat_label: 'France', committees: { abbreviation: 'ILO' } },
        error: null,
      }) }) }) }) }),
      rpc: async (name, args) => { calls.push([name, args]); return { data: 1, error: null }; },
    };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ ...identity, seat: 'Germany' }),
    { status: 200 });
  try {
    const response = await handlers['ecg-refresh'](request({ conferenceId }));
    assert.equal(response.status, 401);
    assert.equal(calls[0][0], 'ecg_revoke_verified_identity');
    assert.equal(calls[0][1].p_credential_revision, 'a'.repeat(64));
  } finally { globalThis.fetch = originalFetch; }
});

test('revocation requires the integration secret', async () => {
  const calls = [];
  globalThis.__createSupabaseClient = () => ({
    rpc: async (name, args) => { calls.push([name, args]); return { error: null }; },
  });
  assert.equal((await handlers['ecg-revocation'](request({ personId: 101,
    revision: 'a'.repeat(64) }))).status, 404);
  const response = await handlers['ecg-revocation'](request({ personId: 101,
    revision: 'a'.repeat(64) }, { 'X-Kamun-Integration-Key': env.get('ECG_INTEGRATION_KEY') }));
  assert.equal(response.status, 204);
  assert.equal(calls[0][0], 'ecg_revoke_verified_identity_all');
});

test('handoff requires a valid binding and returns only a verified ECG ticket', async () => {
  const calls = [];
  globalThis.__createSupabaseClient = (_url, key) => key === 'public-test-key'
    ? { auth: { getUser: async (token) => token === 'valid-user'
      ? { data: { user: { id: 'user-1' } }, error: null }
      : { data: { user: null }, error: new Error('bad token') } } }
    : {
      from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({
        data: { ecg_person_id: 101, credential_revision: 'a'.repeat(64), revoked_at: null,
          access_type: 'member', seat_label: 'France', committees: { abbreviation: 'ILO' } },
        error: null,
      }) }) }) }) }),
      rpc: async (name, args) => { calls.push([name, args]); return { data: 1, error: null }; },
    };
  const originalFetch = globalThis.fetch;
  const ticket = 'A'.repeat(43);
  globalThis.fetch = async () => new Response(JSON.stringify({ ticket, identity }), { status: 200 });
  try {
    const response = await handlers['ecg-handoff'](request({ conferenceId }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).url, `https://cafe.example.test/#handoff=${ticket}`);
    assert.equal(calls[0][0], 'ecg_refresh_verified_identity');
    assert.equal((await handlers['ecg-handoff'](request({ conferenceId },
      { Authorization: 'Bearer invalid' }))).status, 401);
  } finally { globalThis.fetch = originalFetch; }
});

test('handoff rejects an ECG ticket for a different seat', async () => {
  const calls = [];
  globalThis.__createSupabaseClient = (_url, key) => key === 'public-test-key'
    ? { auth: { getUser: async () => ({ data: { user: { id: 'user-1' } }, error: null }) } }
    : {
      from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({
        data: { ecg_person_id: 101, credential_revision: 'a'.repeat(64), revoked_at: null,
          access_type: 'member', seat_label: 'France', committees: { abbreviation: 'ILO' } },
        error: null,
      }) }) }) }) }),
      rpc: async (name) => { calls.push(name); return { data: 1, error: null }; },
    };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    ticket: 'A'.repeat(43), identity: { ...identity, seat: 'Germany' },
  }), { status: 200 });
  try {
    const response = await handlers['ecg-handoff'](request({ conferenceId }));
    assert.equal(response.status, 401);
    assert.equal(calls[0], 'ecg_revoke_verified_identity');
  } finally { globalThis.fetch = originalFetch; }
});

test('logout revokes the authenticated binding before its linked ECE sessions', async () => {
  const events = [];
  const filters = [];
  globalThis.__createSupabaseClient = (_url, key) => key === 'public-test-key'
    ? { auth: { getUser: async (token) => ({ data: { user: token === 'valid-user' ? { id: 'user-1' } : null }, error: null }) } }
    : { rpc: async () => { events.push('admin-binding'); return { error: null }; }, from: (table) => { assert.equal(table, 'ecg_participant_bindings'); return {
      update: () => ({ eq: (name, value) => { filters.push([name, value]); return {
        eq: async (name, value) => { filters.push([name, value]); events.push('binding'); return { error: null }; },
      }; } }),
    }; } };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    events.push('ece');
    const body = JSON.parse(options.body);
    assert.equal(body.action, 'logout');
    assert.match(body.scope, /^[a-f0-9]{64}$/);
    assert.notEqual(body.scope, 'attacker-supplied');
    return new Response(JSON.stringify({ ok: true }));
  };
  try {
    const result = await handlers['ecg-logout'](request({ conferenceId, scope: 'attacker-supplied', userId: 'another-user' }));
    assert.equal(result.status, 200);
    assert.deepEqual(events, ['admin-binding', 'binding', 'ece']);
    assert.deepEqual(filters, [['conference_id', conferenceId], ['user_id', 'user-1']]);
    assert.equal((await handlers['ecg-logout'](request({ conferenceId }, { Authorization: 'Bearer invalid' }))).status, 401);
    globalThis.fetch = async () => new Response('{}', { status: 503 });
    assert.equal((await handlers['ecg-logout'](request({ conferenceId }))).status, 503);
  } finally { globalThis.fetch = originalFetch; }
});

test('handoff rejects a different person even when the committee and seat match', async () => {
  const calls = [];
  globalThis.__createSupabaseClient = (_url, key) => key === 'public-test-key'
    ? { auth: { getUser: async () => ({ data: { user: { id: 'user-1' } }, error: null }) } }
    : {
      from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({
        data: { ecg_person_id: 101, credential_revision: 'a'.repeat(64), revoked_at: null,
          access_type: 'member', seat_label: 'France', committees: { abbreviation: 'ILO' } }, error: null,
      }) }) }) }) }),
      rpc: async (name) => { calls.push(name); return { data: 1, error: null }; },
    };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    ticket: 'A'.repeat(43), identity: { ...identity, personId: 999 },
  }));
  try {
    assert.equal((await handlers['ecg-handoff'](request({ conferenceId }))).status, 401);
    assert.deepEqual(calls, ['ecg_revoke_verified_identity']);
  } finally { globalThis.fetch = originalFetch; }
});

test('admin claim uses only verified admin metadata, keeps throttling, and issues no coffee ticket', async () => {
 const calls = [], actions = [];
 globalThis.__createSupabaseClient = (_url, key) => key === 'public-test-key'
  ? { auth: { getUser: async () => ({ data: { user: { id: 'user-1' } }, error: null }) } }
  : { from: () => ({ update: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }) }),
   rpc: async (name, args) => { calls.push([name,args]); return { data: name === 'ecg_acquire_claim_attempt' ? true : [{ access_type: 'admin' }], error: null }; } };
 const original = globalThis.fetch;
 globalThis.fetch = async (_url, opts) => { const body=JSON.parse(opts.body); actions.push(body.action); return new Response(JSON.stringify(body.action === 'logout' ? {ok:true} : {personId:301,kind:'kamun_admin',committee:null,seat:null,revision:'b'.repeat(64)})); };
 try {
  const result=await handlers['ecg-claim'](request({code:'z9y8x',conferenceId,role:'chair'}));
  assert.equal(result.status,200);
  assert.equal((await result.json()).membership.access_type,'admin');
  const args=calls.find(c=>c[0]==='ecg_bind_verified_admin')[1];
  assert.equal(args.p_ecg_person_id,301); assert.match(args.p_session_scope,/^[a-f0-9]{64}$/);
  assert.deepEqual(actions,['verify','logout']);
  assert.equal(calls[0][0],'ecg_acquire_claim_attempt');
 } finally { globalThis.fetch=original; }
});

test('admin refresh fails closed on upstream outage and rejects a changed identity', async () => {
 const calls=[];
 const { ecgSessionScope }=await import(pathToFileURL(join(dir,'_shared/ecg.js')).href);
 const scope=await ecgSessionScope('user-1',conferenceId);
 globalThis.__createSupabaseClient=(_url,key)=>key==='public-test-key'
  ? {auth:{getUser:async()=>({data:{user:{id:'user-1'}},error:null})}}
  : {from:()=>({select:()=>({eq:()=>({eq:()=>({maybeSingle:async()=>({data:{ecg_person_id:301,credential_revision:'b'.repeat(64),session_scope:scope,revoked_at:null},error:null})})})})}),
   rpc:async(name)=>{calls.push(name);return {data:true,error:null};}};
 const original=globalThis.fetch;
 try {
  globalThis.fetch=async()=>new Response(JSON.stringify({personId:301,kind:'kamun_admin',committee:null,seat:null,revision:'b'.repeat(64)}));
  assert.equal((await handlers['ecg-refresh'](request({conferenceId}))).status,200);
  assert.equal(calls.pop(),'ecg_refresh_verified_admin');
  globalThis.fetch=async()=>new Response('{}',{status:503});
  assert.equal((await handlers['ecg-refresh'](request({conferenceId}))).status,401);
  assert.equal(calls.pop(),'ecg_clear_linked_admin');
  globalThis.fetch=async()=>new Response(JSON.stringify(identity));
  assert.equal((await handlers['ecg-refresh'](request({conferenceId}))).status,401);
  assert.equal(calls.pop(),'ecg_clear_linked_admin');
 } finally {globalThis.fetch=original;}
});

test('app-only guests claim and refresh without gaining coffee, chair or administrator identity', async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const kind of ['faculty_adviser','observer']) {
      const who = { personId: 303, kind, committee: null, seat: null, revision: 'c'.repeat(64) };
      const calls=[];
      globalThis.__createSupabaseClient = (_url,key) => key === 'public-test-key'
        ? {auth:{getUser:async()=>({data:{user:{id:'guest-user'}},error:null})}}
        : { from: table => ({
            update:()=>({eq:()=>({eq:async()=>({error:null})})}),
            select:()=>({eq:()=>({eq:()=>({maybeSingle:async()=>({data:table==='ecg_admin_bindings'?null:{ecg_person_id:303,credential_revision:who.revision,revoked_at:null,access_type:kind,seat_label:null,committees:null},error:null})})})}),
          }),
          rpc:async(name,args)=>{calls.push([name,args]);return {data:name==='ecg_acquire_claim_attempt'?true:name==='ecg_bind_verified_identity'?[{access_type:kind,access_label:kind}]:true,error:null};},
        };
      globalThis.fetch=async(_url,options)=>new Response(JSON.stringify(JSON.parse(options.body).action==='logout'?{ok:true}:who),{status:200});
      assert.equal((await handlers['ecg-claim'](request({code:'AB2CD',conferenceId}))).status,200);
      const bind=calls.find(([name])=>name==='ecg_bind_verified_identity')[1];
      assert.equal(bind.p_kind,kind);assert.equal(bind.p_committee_abbreviation,null);assert.equal(bind.p_seat_label,null);
      assert.equal(calls.some(([name])=>name==='ecg_bind_verified_admin'),false);
      assert.equal((await handlers['ecg-refresh'](request({conferenceId}))).status,200);
      globalThis.fetch=async()=>{throw Error('Guest must never request coffee handoff');};
      assert.equal((await handlers['ecg-handoff'](request({conferenceId}))).status,401);
    }
  } finally {globalThis.fetch=originalFetch;}
});
