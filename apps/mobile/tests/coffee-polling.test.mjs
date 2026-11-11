import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from '../node_modules/typescript/lib/typescript.js';

const dir = mkdtempSync(join(tmpdir(), 'coffee-polling-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}');
writeFileSync(join(dir, 'stubs.js'), `
export const useCallback = fn => fn;
export const useRef = current => ({ current });
export const useState = initial => {
  const index = globalThis.h.values.length;
  const value = typeof initial === 'function' ? initial() : initial;
  globalThis.h.values.push(value);
  return [value, next => { globalThis.h.values[index] = next; }];
};
export const useFocusEffect = fn => { globalThis.h.focus = fn; };
export const AppState = { currentState: 'active', addEventListener: () => ({ remove() {} }) };
export const useAttendeeProfile = () => ({ clearProfile() {} });
export const coffeeRequest = (...args) => globalThis.h.request(...args);
export class CoffeeError extends Error {}
export class AccessExpiredError extends Error {}
export const createCoffeeReadyTracker = () => ({ update: () => ({ visible: [], newlyReady: [] }), reset() {}, dismiss() {} });
export const signalCoffeeReady = async () => {};
`);
const source = readFileSync(new URL('../src/hooks/use-coffee.ts', import.meta.url), 'utf8')
  .replace(/from '[^']+'/g, "from './stubs.js'");
writeFileSync(join(dir, 'hook.js'), ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
const { useCoffee } = await import(pathToFileURL(join(dir, 'hook.js')));
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
const state = open => ({ unchanged: false, version: 1, boundary: 'same', now: new Date(0).toISOString(), nextBoundaryAt: null,
  settings: { orderingEnabled: open }, menu: [], schedule: {}, me: { orders: [] } });

test('visible coffee page fetches full availability every five seconds and cleans up', async () => {
  const originals = { now: Date.now, interval: globalThis.setInterval, clear: globalThis.clearInterval, document: globalThis.document, window: globalThis.window };
  let now = 0;
  let tick;
  let cleared = false;
  const listeners = {};
  let response = state(false);
  let deferred;
  const calls = [];
  globalThis.h = { values: [], request: (...args) => { calls.push(args); return deferred ?? Promise.resolve(response); } };
  Date.now = () => now;
  globalThis.setInterval = fn => { tick = fn; return 123; };
  globalThis.clearInterval = id => { assert.equal(id, 123); cleared = true; };
  globalThis.document = { visibilityState: 'visible', addEventListener: (name, fn) => { listeners[name] = fn; }, removeEventListener: name => { delete listeners[name]; } };
  globalThis.window = { addEventListener: (name, fn) => { listeners[name] = fn; }, removeEventListener: name => { delete listeners[name]; } };
  try {
    useCoffee('conference');
    const cleanup = globalThis.h.focus();
    await flush();
    assert.equal(globalThis.h.values[0].settings.orderingEnabled, false);
    response = state(true);
    now = 4999; tick(); assert.equal(calls.length, 1);
    now = 5000; tick(); await flush();
    assert.equal(globalThis.h.values[0].settings.orderingEnabled, true);
    response = state(false);
    now = 10000; tick(); await flush();
    assert.equal(globalThis.h.values[0].settings.orderingEnabled, false);
    assert.ok(calls.every(([, action]) => JSON.stringify(action) === '{"action":"state"}'));

    globalThis.document.visibilityState = 'hidden';
    now = 20000; tick(); assert.equal(calls.length, 3);
    globalThis.document.visibilityState = 'visible';
    listeners.visibilitychange(); await flush(); assert.equal(calls.length, 4);

    let resolveOld;
    deferred = new Promise(resolve => { resolveOld = resolve; });
    now = 25000; tick();
    now = 40000; tick(); assert.equal(calls.length, 5);
    deferred = undefined;
    response = state(true);
    listeners.online(); await flush();
    resolveOld(state(false)); await flush();
    assert.equal(globalThis.h.values[0].settings.orderingEnabled, true);

    globalThis.h.request = async () => { calls.push([]); throw new Error('network failed'); };
    now = 45000; tick(); await flush();
    assert.equal(globalThis.h.values[3], false);
    const failedCount = calls.length;
    now = 50000; tick(); assert.equal(calls.length, failedCount);
    globalThis.h.request = async () => { calls.push([]); return state(false); };
    now = 75000; tick(); await flush();
    assert.equal(globalThis.h.values[3], true);

    let resolveLeaving;
    globalThis.h.request = () => new Promise(resolve => { resolveLeaving = resolve; });
    now = 80000; tick();
    cleanup();
    resolveLeaving(state(true)); await flush();
    assert.equal(globalThis.h.values[0].settings.orderingEnabled, false);
    assert.equal(cleared, true);
    assert.deepEqual(listeners, {});
  } finally {
    Date.now = originals.now;
    globalThis.setInterval = originals.interval;
    globalThis.clearInterval = originals.clear;
    globalThis.document = originals.document;
    globalThis.window = originals.window;
    delete globalThis.h;
  }
});
