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
