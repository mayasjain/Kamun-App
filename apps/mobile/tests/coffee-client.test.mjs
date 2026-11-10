import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from '../node_modules/typescript/lib/typescript.js';

const dir = mkdtempSync(join(tmpdir(), 'kamun-coffee-client-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}');
writeFileSync(join(dir, 'stub.js'), 'export const supabase = { functions: { invoke: (...args) => globalThis.__coffeeInvoke(...args) } };');
for (const name of ['function-errors', 'coffee-client']) {
  const source = readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), 'utf8')
    .replaceAll("'@/lib/supabase'", "'./stub.js'").replaceAll("'@/lib/function-errors'", "'./function-errors.js'");
  writeFileSync(join(dir, name + '.js'), ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
}
const { coffeeRequest, CoffeeError, newCoffeeRequestKey } = await import(pathToFileURL(join(dir, 'coffee-client.js')));
const conferenceId = 'fake-conference';

test('ordering stays in KAMUN and retries preserve the exact submission key', async () => {
  const order = { itemId: 1, optionIds: [2], idempotencyKey: newCoffeeRequestKey() };
  const sent = [];
  globalThis.__coffeeInvoke = async (name, options) => {
    assert.equal(name, 'ecg-coffee');
    sent.push(options.body);
    if (sent.length === 1) throw new Error('lost response');
    return { data: { order: { id: 8, dayCode: '008' } }, error: null };
  };
  await assert.rejects(coffeeRequest(conferenceId, { action: 'place_order', order }), error => error instanceof CoffeeError && error.uncertain);
  assert.deepEqual(await coffeeRequest(conferenceId, { action: 'place_order', order }), { order: { id: 8, dayCode: '008' } });
  assert.deepEqual(sent[0], sent[1]);
  assert.equal('personId' in sent[0], false);
});

test('business rejection is definite; unavailable or malformed mutation responses are uncertain', async () => {
  const order = { itemId: 1, optionIds: [], idempotencyKey: newCoffeeRequestKey() };
  globalThis.__coffeeInvoke = async () => ({ data: null, error: { context: Response.json({ error: 'round_full' }, { status: 409 }) } });
  await assert.rejects(coffeeRequest(conferenceId, { action: 'place_order', order }), error => error.code === 'round_full' && !error.uncertain);
  globalThis.__coffeeInvoke = async () => ({ data: {}, error: null });
  await assert.rejects(coffeeRequest(conferenceId, { action: 'place_order', order }), error => error.uncertain);
});

test('revoked access is treated as expired and purged records have a specific explanation', async () => {
  globalThis.__coffeeInvoke = async () => ({ data: null, error: { context: Response.json({ error: 'revoked' }, { status: 401 }) } });
  await assert.rejects(coffeeRequest(conferenceId, { action: 'state' }), /access has changed/);
  globalThis.__coffeeInvoke = async () => ({ data: null, error: { context: Response.json({ error: 'data_purged' }, { status: 410 }) } });
  await assert.rejects(coffeeRequest(conferenceId, { action: 'state' }), error => error.code === 'data_purged' && !error.uncertain);
});
