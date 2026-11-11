import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { onRequestPost } from './apps/cafe/functions/api/integration/participant';
import { createTestDb, addPerson, codeFor, TEST_PEPPER, at } from './packages/core/test/helpers/db';
import { verifyKamunCode, type VerifiedKamunIdentity } from './packages/core/src/kamun-integration';
import { openRound } from './packages/core/src/rounds';
import type { Env } from './packages/core/src/env';

let fixture: Awaited<ReturnType<typeof createTestDb>>;
let people: VerifiedKamunIdentity[];
const secret = 'FAKE-load-test-integration-key-not-production';
const report: object[] = [];
beforeAll(async () => { fixture = await createTestDb('disposable-coffee-load-100', { conference: true }); });
beforeEach(async () => {
  await fixture.reset();
  const { results: seats } = await fixture.db.prepare('SELECT s.label, c.short_name AS committee FROM seats s JOIN committees c ON c.id = s.committee_id ORDER BY s.id LIMIT 100').all<{label: string; committee: string}>();
  expect(seats).toHaveLength(100);
  people = [];
  for (const seat of seats) {
    const id = await addPerson(fixture.db, { committee: seat.committee, seat: seat.label });
    const identity = await verifyKamunCode(fixture.db, TEST_PEPPER, await codeFor(fixture.db, id));
    if (!identity) throw new Error('invalid fake identity');
    people.push(identity);
  }
});
afterAll(async () => { writeFileSync('/tmp/kamun-coffee-load-100/results.json', JSON.stringify(report, null, 2)); await fixture?.dispose(); });
async function invoke(identity: VerifiedKamunIdentity, action: object) {
  const start = performance.now();
  try {
    const response = await (onRequestPost as Function)({
      request: new Request('https://load.example.test/api/integration/participant?at=2026-11-14T09:45', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Kamun-Integration-Key': secret },
        body: JSON.stringify({ identity, ...action }),
      }),
      env: { DB: fixture.db, ENVIRONMENT: 'preview', KAMUN_INTEGRATION_KEY: secret } as Env,
    });
    return { status: response.status, body: await response.json(), ms: performance.now() - start };
  } catch (error) { return { status: 0, body: { error: String(error) }, ms: performance.now() - start }; }
}
const order = () => ({ itemId: 1, optionIds: [], idempotencyKey: crypto.randomUUID() });
function summarize(name: string, responses: Awaited<ReturnType<typeof invoke>>[], elapsed: number) {
  const times = responses.map(r => r.ms).sort((a, b) => a - b);
  const statuses: Record<string, number> = {};
  for (const r of responses) { const key = `${r.status}${r.body.error ? ':' + r.body.error : ''}`; statuses[key] = (statuses[key] ?? 0) + 1; }
  const result = { name, requests: responses.length, elapsedMs: Math.round(elapsed), statuses,
    medianMs: Math.round(times[Math.floor(times.length * .5)]), p95Ms: Math.round(times[Math.ceil(times.length * .95) - 1]), maxMs: Math.round(times.at(-1)!) };
  report.push(result); console.log(JSON.stringify(result));
}
it('100 simultaneous orders with 100 places plus 100 simultaneous full state reads', async () => {
  expect((await openRound(fixture.db, at.satSessionII, 'barista', { capacity: 100, until: 'block' })).ok).toBe(true);
  const start = performance.now();
  const [orders, reads] = await Promise.all([
    Promise.all(people.map(p => invoke(p, { action: 'place_order', order: order() }))),
    Promise.all(people.map(p => invoke(p, { action: 'state' }))),
  ]);
  summarize('100-order burst alongside 100 full reads: orders', orders, performance.now() - start);
  summarize('100-order burst alongside 100 full reads: reads', reads, performance.now() - start);
  expect(orders.every(r => r.status === 201)).toBe(true);
  expect(reads.every(r => r.status === 200)).toBe(true);
  expect(await fixture.db.prepare('SELECT count(*) AS n FROM orders').first('n')).toBe(100);
  const final = await Promise.all(people.map(p => invoke(p, { action: 'state' })));
  expect(final.every(r => r.status === 200 && r.body.result.me.orders.length === 1)).toBe(true);
});
it('100 simultaneous orders cannot oversell a 20-place round', async () => {
  await openRound(fixture.db, at.satSessionII, 'barista', { capacity: 20, until: 'block' });
  const start = performance.now();
  const results = await Promise.all(people.map(p => invoke(p, { action: 'place_order', order: order() })));
  summarize('100-order burst with 20 places', results, performance.now() - start);
  expect(results.filter(r => r.status === 201)).toHaveLength(20);
  expect(results.filter(r => r.status === 409 && ['round_full', 'queue_closed'].includes(r.body.error))).toHaveLength(80);
  expect(await fixture.db.prepare('SELECT count(*) AS n FROM orders').first('n')).toBe(20);
});
it('simultaneous duplicate retries create only one order per delegate', async () => {
  await openRound(fixture.db, at.satSessionII, 'barista', { capacity: 100, until: 'block' });
  const start = performance.now();
  const pairs = await Promise.all(people.map(p => { const input = order(); return Promise.all([invoke(p, { action: 'place_order', order: input }), invoke(p, { action: 'place_order', order: input })]); }));
  summarize('100 delegates double-submit: 200 requests', pairs.flat(), performance.now() - start);
  expect(pairs.every(pair => pair.every(r => r.status === 201 || r.status === 200) && pair[0].body.result.order.id === pair[1].body.result.order.id)).toBe(true);
  expect(await fixture.db.prepare('SELECT count(*) AS n FROM orders').first('n')).toBe(100);
});
it('100 viewers polling every five seconds for 30 seconds with an order burst during polling', async () => {
  await openRound(fixture.db, at.satSessionII, 'barista', { capacity: 100, until: 'block' });
  const start = performance.now();
  const reads: Awaited<ReturnType<typeof invoke>>[] = [];
  let orders: Awaited<ReturnType<typeof invoke>>[] = [];
  const tasks: Promise<void>[] = [];
  // Synchronized groups reproduce the largest polling burst, rather than spreading it out.
  for (let cycle = 0; cycle < 6; cycle++) {
    if (cycle) await new Promise(resolve => setTimeout(resolve, Math.max(0, start + cycle * 5000 - performance.now())));
    tasks.push(Promise.all(people.map(p => invoke(p, { action: 'state' }))).then(r => { reads.push(...r); }));
    if (cycle === 2) tasks.push(Promise.all(people.map(p => invoke(p, { action: 'place_order', order: order() }))).then(r => { orders = r; }));
  }
  await Promise.all(tasks);
  summarize('30-second polling scenario: 600 full reads', reads, performance.now() - start);
  summarize('30-second polling scenario: order burst', orders, performance.now() - start);
  expect(reads).toHaveLength(600);
  expect(reads.every(r => r.status === 200)).toBe(true);
  expect(orders.filter(r => r.status === 201)).toHaveLength(100);
  expect(await fixture.db.prepare('SELECT count(*) AS n FROM orders').first('n')).toBe(100);
});
