import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createCoffeeReadyTracker } from '../src/lib/coffee-ready.ts';

const order = (id, status = 'ready') => ({ id, dayCode: String(id).padStart(3, '0'), status });
test('an existing ready order gets a banner on entry without an unexpected vibration', () => {
  const tracker = createCoffeeReadyTracker();
  const result = tracker.update([order(1)]);
  assert.deepEqual(result.visible.map(value => value.id), [1]);
  assert.equal(result.newlyReady.length, 0);
});
test('a queued-to-ready transition signals once; repeated polls and dismissal do not repeat it', () => {
  const tracker = createCoffeeReadyTracker();
  tracker.update([order(1, 'queued')]);
  assert.deepEqual(tracker.update([order(1)]).newlyReady.map(value => value.id), [1]);
  assert.equal(tracker.update([order(1)]).newlyReady.length, 0);
  tracker.dismiss([1]);
  assert.deepEqual(tracker.update([order(1)]), { visible: [], newlyReady: [] });
  assert.deepEqual(tracker.update([order(1, 'delivered')]), { visible: [], newlyReady: [] });
});
test('multiple orders and staff undo are tracked by unique order ID, not the daily display code', () => {
  const tracker = createCoffeeReadyTracker();
  tracker.update([]);
  const first = { ...order(1), dayCode: '001' };
  const second = { ...order(2), dayCode: '001' };
  assert.equal(tracker.update([first, second]).newlyReady.length, 2);
  tracker.dismiss([1]);
  assert.deepEqual(tracker.update([first, second]).visible.map(value => value.id), [2]);
  tracker.update([order(1, 'queued'), second]);
  assert.deepEqual(tracker.update([first, second]).newlyReady.map(value => value.id), [1]);
  tracker.reset();
  const reopened = tracker.update([first]);
  assert.equal(reopened.visible.length, 1);
  assert.equal(reopened.newlyReady.length, 0);
});
