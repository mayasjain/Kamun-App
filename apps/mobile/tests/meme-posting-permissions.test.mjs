import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from '../node_modules/typescript/lib/typescript.js';

const source = readFileSync(new URL('../src/hooks/use-meme-posting-committees.ts', import.meta.url), 'utf8').replace(/^import .*;\n/gm, '');
const output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const { requestMemePostingCommittees } = await import('data:text/javascript;base64,' + Buffer.from(output).toString('base64'));
const profile = { conferenceId: 'conference', committeeAbbreviation: 'IPC' };
const tick = () => new Promise(resolve => setImmediate(resolve));

test('a switched account cannot receive a late grant from the previous IPC account', async () => {
 const published = [];
 let finishOld;
 const cancel = requestMemePostingCommittees(profile, () => new Promise(resolve => { finishOld = resolve; }), value => published.push(value));
 cancel();
 const nextProfile = { ...profile, committeeAbbreviation: 'ILO' };
 requestMemePostingCommittees(nextProfile, async () => ['ilo'], value => published.push(value));
 await tick();
 finishOld(['ipc', 'iaea']);
 await tick();
 assert.deepEqual(published, [{ profile: nextProfile, ids: ['ilo'], failed: false }]);
});

test('permission failure grants nothing and a retry can restore assigned access', async () => {
 const published = [];
 requestMemePostingCommittees(profile, async () => { throw new Error('offline'); }, value => published.push(value));
 await tick();
 requestMemePostingCommittees(profile, async () => ['ipc', 'iaea'], value => published.push(value));
 await tick();
 assert.deepEqual(published.map(result => [result.ids, result.failed]), [[[], true], [['ipc', 'iaea'], false]]);
});

test('leaving the padlet cancels both success and error publication', async () => {
 for (const rejected of [false, true]) {
  let complete;
  const published = [];
  const cancel = requestMemePostingCommittees(profile, () => new Promise((resolve,reject) => { complete = () => rejected ? reject(new Error('late')) : resolve(['ipc']); }), value => published.push(value));
  cancel(); complete(); await tick();
  assert.deepEqual(published, []);
 }
});
