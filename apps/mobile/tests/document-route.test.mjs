import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
const docs = JSON.parse(await readFile(new URL('../src/constants/document-links.json', import.meta.url), 'utf8'));
const source = (await readFile(new URL('../functions/docs/[[path]].js', import.meta.url), 'utf8')).replace("import documents from '../../src/constants/document-links.json';", `const documents = ${JSON.stringify(docs)};`);
const { onRequest } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
test('unknown documents and unsupported methods never fetch upstream', async () => {
 assert.equal((await onRequest({ request: new Request('https://kamun.test/docs/missing.pdf') })).status, 404);
 assert.equal((await onRequest({ request: new Request('https://kamun.test/docs/code-of-conduct.pdf', { method: 'POST' }) })).status, 405);
});
test('PDF route streams ranges and preserves the short inline filename', async () => {
 const original = globalThis.fetch;
 try {
  globalThis.fetch = async (url, init) => {
   assert.equal(url, docs.find(d => d.slug === 'code-of-conduct.pdf').source);
   assert.equal(init.headers.get('range'), 'bytes=0-3');
   return new Response('%PDF', { status: 206, headers: { 'content-range': 'bytes 0-3/100', 'accept-ranges': 'bytes' } });
  };
  const response = await onRequest({ request: new Request('https://kamun.test/docs/code-of-conduct.pdf', { headers: { range: 'bytes=0-3' } }) });
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('content-disposition'), 'inline; filename="code-of-conduct.pdf"');
  assert.equal(await response.text(), '%PDF');
 } finally { globalThis.fetch = original; }
});
