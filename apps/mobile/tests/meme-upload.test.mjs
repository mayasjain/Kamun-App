import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from '../node_modules/typescript/lib/typescript.js';

const source = readFileSync(new URL('../src/lib/committee-memes.ts', import.meta.url), 'utf8')
 .replace(/^import .*;\n/gm, '')
 .replace("const bucket =", "const { File, Platform, supabase, cacheMemes, clearMemeCache, memeCacheGeneration } = globalThis.__memeUploadFixture;\nconst bucket =");
async function fixture(rejectReservation = false) {
 const calls = [];
 const path = 'user/conference/server-issued.png';
 globalThis.__memeUploadFixture = {
  Platform: { OS: 'native' }, File: class { async arrayBuffer() { return new ArrayBuffer(3); } },
  cacheMemes() {}, clearMemeCache() {}, memeCacheGeneration: () => 0,
  supabase: {
   auth: { getUser: async () => ({ data: { user: { id: 'user' } } }) },
   rpc: async (name, args) => {
    calls.push([name, args]);
    return name === 'reserve_meme_upload'
     ? { data: rejectReservation ? null : path, error: rejectReservation ? new Error('quota reached') : null }
     : { data: 'post-id', error: null };
   },
   storage: { from: () => ({ upload: async (name) => { calls.push(['upload', name]); return { error: null }; } }) },
  },
 };
 const output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
 const module = await import('data:text/javascript;base64,' + Buffer.from(output + '\n//' + Math.random()).toString('base64'));
 return { calls, module, path };
}
test('meme upload reserves before sending bytes and publishes the exact reserved path', async () => {
 const { calls, module, path } = await fixture();
 await module.postMeme('conference', null, { uri: 'fixture', mimeType: 'image/png' }, 'caption');
 assert.deepEqual(calls.map(c => c[0]), ['reserve_meme_upload', 'upload', 'post_committee_meme']);
 assert.equal(calls[1][1], path);
 assert.equal(calls[2][1].p_image_path, path);
});
test('quota denial sends no image bytes and creates no post', async () => {
 const { calls, module } = await fixture(true);
 await assert.rejects(module.postMeme('conference', null, { uri: 'fixture', mimeType: 'image/png' }, ''), /quota reached/);
 assert.deepEqual(calls.map(c => c[0]), ['reserve_meme_upload']);
});
test('Chairs uploads use the private posting endpoint and shared upload limits', async () => {
 const { calls, module, path } = await fixture();
 await module.postMeme('conference', module.CHAIRS_GALLERY, { uri: 'fixture', mimeType: 'image/png' }, 'chair caption');
 assert.deepEqual(calls.map(c => c[0]), ['reserve_meme_upload', 'upload', 'post_chair_meme']);
 assert.deepEqual(calls[2][1], { p_conference_id: 'conference', p_image_path: path, p_caption: 'chair caption' });
});
