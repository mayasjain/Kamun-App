import assert from 'node:assert/strict';
import { test } from 'node:test';
import { coffeeBlockedReason, coffeeOrderStatus, coffeeOpening } from '../src/lib/coffee-display.ts';

const state = () => ({
  me: { activeLimit: 1, activeCount: 0, dailyLimit: 2, dailyCount: 0,
    person: { committee: { short: 'ILO' } }, queue: { kind: 'round', round: { open: true, closeReason: null } } },
  nowLocal: { day: '2026-11-14', time: '09:45' },
  schedule: { current: { label: 'Session', end: '10:30', fulfilment: 'delivery' }, blocks: [] },
  settings: { barLocationLabel: 'the foyer' },
});
test('delegate limits and chair queues use the server state', () => {
  const s = state();
  assert.equal(coffeeBlockedReason(s), null);
  s.me.activeCount = 1;
  assert.match(coffeeBlockedReason(s), /on its way/);
  s.me.activeCount = 0;
  s.me.dailyCount = 2;
  assert.match(coffeeBlockedReason(s), /today/);
  s.me.dailyLimit = null;
  s.me.activeLimit = null;
  s.me.queue = { kind: 'chairs', paused: false };
  assert.equal(coffeeBlockedReason(s), null);
  s.me.queue.paused = true;
  assert.match(coffeeBlockedReason(s), /paused/);
});
test('ready instructions distinguish delivery from pickup and show cancellations', () => {
  assert.match(coffeeOrderStatus({ status: 'ready', fulfilment: 'delivery' }, 'the foyer'), /runner/);
  assert.match(coffeeOrderStatus({ status: 'ready', fulfilment: 'pickup' }, 'the foyer'), /collect at the foyer/);
  assert.equal(coffeeOrderStatus({ status: 'cancelled', cancelReason: 'Out of oat milk' }, ''), 'Cancelled · Out of oat milk');
  assert.match(coffeeOpening(state()).detail, /Delivery/);
});
test('next opening card uses the earliest enabled coffee period and server date', () => {
  const s = state();
  s.schedule.current = null;
  s.nowLocal = { day: '2026-11-13', time: '10:00' };
  s.schedule.blocks = [
    { id: 3, enabled: true, fulfilment: 'pickup', day: '2026-11-15', start: '09:00', label: 'Later session' },
    { id: 1, enabled: false, fulfilment: 'delivery', day: '2026-11-14', start: '08:00', label: 'Disabled' },
    { id: 2, enabled: true, fulfilment: 'delivery', day: '2026-11-14', start: '09:00', label: 'Committee Session II' },
  ];
  const opening = coffeeOpening(s);
  assert.equal(opening.eyebrow, 'Next');
  assert.equal(opening.title, 'Committee Session II');
  assert.match(opening.detail, /Saturday.*14.*Nov.*09:00/);
  s.schedule.blocks = [];
  assert.equal(coffeeOpening(s).title, 'Coffee bar closed');
});

test('full opening schedule sorts enabled blocks without losing closed meal periods or mutating input', async () => {
  const { coffeeScheduleDays, coffeeDayLabel, coffeeFulfilmentLabel } = await import('../src/lib/coffee-display.ts');
  const blocks = [
    { id: 4, day: '2026-11-15', start: '09:00', end: '10:00', enabled: true, fulfilment: 'delivery' },
    { id: 2, day: '2026-11-14', start: '12:00', end: '13:00', enabled: true, fulfilment: 'none' },
    { id: 1, day: '2026-11-14', start: '09:00', end: '10:00', enabled: true, fulfilment: 'delivery' },
    { id: 3, day: '2026-11-14', start: '08:00', end: '09:00', enabled: false, fulfilment: 'pickup' },
  ];
  const original = JSON.stringify(blocks);
  const days = coffeeScheduleDays(blocks);
  assert.deepEqual(days.map(value => value.day), ['2026-11-14', '2026-11-15']);
  assert.deepEqual(days[0].blocks.map(block => block.id), [1, 2]);
  assert.equal(coffeeFulfilmentLabel(days[0].blocks[1].fulfilment), 'Closed for ordering');
  assert.match(coffeeDayLabel('2026-11-14'), /Saturday.*14.*Nov/);
  assert.equal(JSON.stringify(blocks), original);
  assert.deepEqual(coffeeScheduleDays([]), []);
});
test('order progress distinguishes queued, preparing, ready and the correct final fulfilment step', async () => {
  const { coffeeProgress } = await import('../src/lib/coffee-display.ts');
  for (const [status, index] of [['queued', 0], ['preparing', 1], ['ready', 2], ['delivered', 3]]) {
    const progress = coffeeProgress({ status, fulfilment: 'delivery' });
    assert.equal(progress.index, index);
    assert.equal(progress.labels[3], 'Delivered');
  }
  assert.equal(coffeeProgress({ status: 'picked_up', fulfilment: 'pickup' }).labels[3], 'Picked up');
  assert.equal(coffeeProgress({ status: 'cancelled', fulfilment: 'delivery' }), null);
});

test('whole euro prices omit decimals while fractional euro prices retain cents', async () => {
  const { coffeeMoney } = await import('../src/lib/coffee-display.ts');
  assert.equal(coffeeMoney(200), '€2');
  assert.equal(coffeeMoney(0), '€0');
  assert.equal(coffeeMoney(250), '€2.50');
  assert.equal(coffeeMoney(205), '€2.05');
});
