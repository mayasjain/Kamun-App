import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from '../../apps/mobile/node_modules/typescript/lib/typescript.js';

const dir = mkdtempSync(join(tmpdir(), 'kamun-coffee-edge-'));
mkdirSync(join(dir, '_shared'));
mkdirSync(join(dir, 'ecg-coffee'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}');
writeFileSync(join(dir, 'stub.js'), 'export const createClient = (...args) => globalThis.__coffeeClient(...args);');
for (const name of ['_shared/ecg', '_shared/coffee-input', 'ecg-coffee/index']) {
  const source = readFileSync(new URL(`../functions/${name}.ts`, import.meta.url), 'utf8')
    .replaceAll('npm:@supabase/supabase-js@2', '../stub.js').replaceAll('../_shared/ecg.ts', '../_shared/ecg.js')
    .replaceAll('../_shared/coffee-input.ts', '../_shared/coffee-input.js');
  writeFileSync(join(dir, `${name}.js`), ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
}
const env = new Map([['SUPABASE_URL', 'https://db.example.test'], ['SUPABASE_ANON_KEY', 'public'], ['SUPABASE_SERVICE_ROLE_KEY', 'secret'],
  ['ECG_INTEGRATION_URL', 'https://coffee.example.test'], ['ECG_INTEGRATION_KEY', 'only-the-server-knows-this-test-secret']]);
let handler;
globalThis.Deno = { env: { get: key => env.get(key) }, serve: value => { handler = value; } };
await import(pathToFileURL(join(dir, 'ecg-coffee/index.js')).href);
const { parseCoffeeInput } = await import(pathToFileURL(join(dir, '_shared/coffee-input.js')).href);
const conferenceId = '10000000-0000-4000-8000-000000000001';
const identity = { personId: 101, revision: 'a'.repeat(64), kind: 'delegate', committee: 'ILO', seat: 'France' };
const order = { itemId: 1, optionIds: [2], idempotencyKey: 'ab12cd34-1234-4abc-8abc-123456789012', note: 'Warm, please' };
const request = (payload, token = 'valid') => new Request('https://kamun.example.test/ecg-coffee', { method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ conferenceId, ...payload }) });
function clients(binding = { ecg_person_id: 101, credential_revision: identity.revision, access_type: 'member', seat_label: 'France', committees: { abbreviation: 'ILO' }, revoked_at: null }) {
  const calls = [];
  globalThis.__coffeeClient = (_url, key) => key === 'public' ? { auth: { getUser: async token => ({ data: { user: token === 'valid' ? { id: 'user-1' } : null }, error: null }) } }
    : { from: table => {
      const q = { select: () => q, eq: (key, value) => { calls.push([key, value]); return q; }, maybeSingle: async () => ({ data: binding, error: null }) };
      assert.equal(table, 'ecg_participant_bindings'); return q;
    }, rpc: async (name, args) => { calls.push([name, args]); return { data: true, error: null }; } };
  return calls;
}

test('coffee action validation rejects identity, prices, arbitrary routes and malformed orders', () => {
  assert.ok(parseCoffeeInput({ conferenceId, action: 'place_order', order }));
  for (const payload of [
    { action: 'state', personId: 999 }, { action: 'state', query: { url: '/staff' } },
    { action: 'admin' }, { action: 'cancel_order', orderId: -1 },
    { action: 'place_order', order: { ...order, priceCents: 0 } },
    { action: 'place_order', order: { ...order, idempotencyKey: 'bad' } },
    { action: 'place_order', order: { ...order, optionIds: [0] } },
  ]) assert.equal(parseCoffeeInput({ conferenceId, ...payload }), null);
});

test('the bridge binds requests to the authenticated user and never exposes its private identity or key', async () => {
  const calls = clients();
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), 'https://coffee.example.test/api/integration/participant');
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers['X-Kamun-Integration-Key'], env.get('ECG_INTEGRATION_KEY'));
    assert.deepEqual(JSON.parse(options.body), { action: 'place_order', order, identity });
    return Response.json({ identity, result: { order: { id: 15, dayCode: '015' } } }, { status: 201 });
  };
  try {
    const response = await handler(request({ action: 'place_order', order }));
    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), { order: { id: 15, dayCode: '015' } });
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.ok(calls.some(([key, value]) => key === 'user_id' && value === 'user-1'));
    assert.ok(calls.some(([name]) => name === 'ecg_refresh_verified_identity'));
  } finally { globalThis.fetch = original; }
});

test('unbound, revoked, admin and unauthenticated callers never reach ECE', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('must not fetch'); };
  try {
    for (const binding of [null, { revoked_at: '2026-11-10' }, { access_type: 'admin', revoked_at: null }]) {
      clients(binding);
      assert.equal((await handler(request({ action: 'state' }))).status, 401);
    }
    clients();
    assert.equal((await handler(request({ action: 'state' }, 'invalid'))).status, 401);
    assert.equal((await handler(request({ action: 'state', personId: 999 }))).status, 400);
  } finally { globalThis.fetch = original; }
});

test('changed identity or expired ECE access revokes the old binding', async () => {
  const original = globalThis.fetch;
  try {
    for (const changed of ['seat', 'revision', 'kind', 'personId']) {
      const calls = clients();
      globalThis.fetch = async () => Response.json({ identity: { ...identity, [changed]: 'different' }, result: {} });
      assert.equal((await handler(request({ action: 'state' }))).status, 401);
      assert.ok(calls.some(([name]) => name === 'ecg_revoke_verified_identity'));
    }
    clients();
    globalThis.fetch = async () => Response.json({ error: 'inactive' }, { status: 401 });
    assert.equal((await handler(request({ action: 'state' }))).status, 401);
  } finally { globalThis.fetch = original; }
});

test('business failures are preserved and transport failures stay retryable', async () => {
  clients();
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json({ identity, error: 'round_full' }, { status: 409 });
    const response = await handler(request({ action: 'place_order', order }));
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), { error: 'round_full' });
    globalThis.fetch = async () => { throw new Error('timeout'); };
    assert.equal((await handler(request({ action: 'place_order', order }))).status, 503);
    globalThis.fetch = async () => Response.json({ error: 'data_purged' }, { status: 410 });
    assert.equal((await handler(request({ action: 'state' }))).status, 410);
  } finally { globalThis.fetch = original; }
});
