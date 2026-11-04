import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toInstant, localTime } from '../src/lib/berlin-time.ts';

test('Karlsruhe winter and summer times map to the correct UTC instant', () => {
  assert.equal(toInstant('2026-11-13T09:00'), '2026-11-13T08:00:00.000Z');
  assert.equal(toInstant('2026-07-13T09:00'), '2026-07-13T07:00:00.000Z');
  assert.equal(localTime('2026-11-13T08:00:00Z'), '2026-11-13T09:00');
});
test('rejects nonexistent and ambiguous DST wall times', () => {
  assert.throws(() => toInstant('2026-03-29T02:30'));
  assert.throws(() => toInstant('2026-10-25T02:30'));
});
test('rejects malformed and impossible dates instead of normalizing them', () => {
  for (const date of ['', '2026-02-30T12:00', '2026-13-01T12:00', '2026-11-13T24:15']) assert.throws(() => toInstant(date));
});
