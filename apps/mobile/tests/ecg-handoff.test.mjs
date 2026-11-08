import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from '../node_modules/typescript/lib/typescript.js';

const dir = mkdtempSync(join(tmpdir(), 'kamun-handoff-client-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}');
writeFileSync(join(dir, 'stubs.js'), `
export const Platform = { OS: 'web' };
export const openURL = async (url) => globalThis.__opened.push(url);
export const KAMUN_CONFERENCE_ID = 'test-conference';
export const supabase = { functions: { invoke: (...args) => globalThis.__invoke(...args) },
  auth: { signOut: async () => ({ error: null }) } }; 
`);
for (const name of ['function-errors', 'ecg-handoff']) {
  let source = readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), 'utf8');
  for (const module of ['expo-linking', 'react-native', '@/lib/conference-id', '@/lib/supabase'])
    source = source.replaceAll(`'${module}'`, "'./stubs.js'");
  source = source.replaceAll("'@/lib/function-errors'", "'./function-errors.js'");
  writeFileSync(join(dir, name + '.js'), ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText);
}
const { openEcgWithKamunIdentity, closeEcgSession, signOutOfBothApps, resumePendingSignOut } = await import(pathToFileURL(join(dir, 'ecg-handoff.js')));
const ticket = 'A'.repeat(43);
globalThis.__opened = [];
globalThis.window = { location: { assign: (url) => globalThis.__opened.push(url) } };

test('opens only the configured ECE origin with an opaque one-use ticket', async () => {
  globalThis.__invoke = async (name) => {
    assert.equal(name, 'ecg-handoff');
    return { data: { url: `https://kamun-ece-cafe.pages.dev/#handoff=${ticket}` }, error: null };
  };
  await openEcgWithKamunIdentity();
  assert.equal(globalThis.__opened.at(-1), `https://kamun-ece-cafe.pages.dev/#handoff=${ticket}`);
  for (const url of [`https://evil.example/#handoff=${ticket}`,
    `https://ece-atelier-cafe.pages.dev/#handoff=${ticket}`,
    `https://kamun-ece-covfefe.pages.dev/#handoff=${ticket}`,
    `https://kamun-ece-cafe.pages.dev/?code=secret#handoff=${ticket}`, 'https://kamun-ece-cafe.pages.dev/#code=secret']) {
    globalThis.__invoke = async () => ({ data: { url }, error: null });
    await assert.rejects(openEcgWithKamunIdentity(), /invalid link/);
  }
  assert.equal(globalThis.__opened.length, 1);
});

test('reads revoked access from an HTTP error without opening a remembered ECE account', async () => {
  globalThis.__invoke = async () => ({ data: null, error: {
    context: new Response(JSON.stringify({ error: 'revoked' }), { status: 401 }),
  } });
  await assert.rejects(openEcgWithKamunIdentity(), /access has changed/);
  assert.equal(globalThis.__opened.length, 1);
});

test('failed remote logout is reported, so the caller retains the ability to retry', async () => {
  globalThis.__invoke = async () => ({ data: null, error: new Error('offline') });
  await assert.rejects(closeEcgSession(), /Could not finish signing out of KAMUN/);
  globalThis.__invoke = async (name) => { assert.equal(name, 'ecg-logout'); return { data: { ok: true }, error: null }; };
  await closeEcgSession();
});

test('an interrupted shared logout is retried on return before restoring access', async () => {
  const stored = new Map();
  globalThis.localStorage = { getItem: (key) => stored.get(key), setItem: (key, value) => stored.set(key, value), removeItem: (key) => stored.delete(key) };
  globalThis.__invoke = async () => ({ data: null, error: new Error('offline') });
  await assert.rejects(signOutOfBothApps(), /Could not finish signing out of KAMUN/);
  assert.equal(stored.get('kamun.pending-sign-out.v1'), '1');
  globalThis.__invoke = async () => ({ data: { ok: true }, error: null });
  assert.equal(await resumePendingSignOut(), true);
  assert.equal(stored.size, 0);
  assert.equal(await resumePendingSignOut(), false);
});
