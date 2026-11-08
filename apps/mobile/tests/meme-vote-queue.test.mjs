import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import ts from '../node_modules/typescript/lib/typescript.js';
const source = readFileSync(new URL('../src/lib/meme-vote-queue.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const { createMemeVoteQueue } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const tick = () => new Promise(resolve => setImmediate(resolve));
function setup() {
 let activity = { meme_id: 'meme', upvotes: 4, downvotes: 2, my_vote: 0, comment_count: 3 };
 const writes = [];
 let errors = 0;
 const queue = createMemeVoteQueue({ current: () => activity, publish: next => { activity = next; },
  save: vote => new Promise((resolve, reject) => writes.push({ vote, resolve, reject })), onError: () => errors++ });
 return { queue, writes, activity: () => activity, errors: () => errors };
}
test('rapid votes update immediately and serialize the latest intention without refetching comments', async () => {
 const s = setup();
 s.queue.toggle(1);
 assert.deepEqual([s.activity().upvotes, s.activity().my_vote], [5, 1]);
 s.queue.toggle(-1);
 s.queue.toggle(-1);
 assert.deepEqual([s.activity().upvotes, s.activity().downvotes, s.activity().my_vote], [4, 2, 0]);
 assert.equal(s.writes.length, 1);
 s.writes[0].resolve(); await tick();
 assert.deepEqual(s.writes.map(w => w.vote), [1, 0]);
 s.writes[1].resolve(); await tick();
 assert.equal(s.queue.pending, false);
 assert.equal(s.activity().comment_count, 3);
});
test('failed final vote restores the last confirmed choice and allows retry', async () => {
 const s = setup();
 s.queue.toggle(1); s.writes[0].resolve(); await tick();
 s.queue.toggle(-1); s.writes[1].reject(new Error('offline')); await tick();
 assert.deepEqual([s.activity().upvotes, s.activity().downvotes, s.activity().my_vote], [5, 2, 1]);
 assert.equal(s.errors(), 1);
 assert.equal(s.queue.pending, false);
 s.queue.toggle(-1); s.writes[2].resolve(); await tick();
 assert.equal(s.activity().my_vote, -1);
});
test('failure of an older request does not roll back a newer tap', async () => {
 const s = setup();
 s.queue.toggle(1); s.queue.toggle(-1);
 s.writes[0].reject(new Error('offline')); await tick();
 assert.equal(s.activity().my_vote, -1);
 assert.equal(s.writes[1].vote, -1);
 s.writes[1].resolve(); await tick();
 assert.equal(s.errors(), 0);
 assert.equal(s.queue.pending, false);
});
