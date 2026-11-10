import assert from 'node:assert/strict';
import { test } from 'node:test';
import { orderAnnouncements } from '../src/lib/announcement-order.ts';

test('a newer routine post cannot displace published urgent notices', () => {
  const items = [
    { id: 'routine', priority: 'normal', publishedAt: '2026-11-10T12:00:00Z' },
    { id: 'urgent-old', priority: 'urgent', publishedAt: '2026-11-09T12:00:00Z' },
    { id: 'urgent-new', priority: 'urgent', publishedAt: '2026-11-10T11:00:00Z' },
    { id: 'important', priority: 'important', publishedAt: '2026-11-10T10:00:00Z' },
  ];
  const original = [...items];
  const ordered = orderAnnouncements(items);
  assert.deepEqual(ordered.map(item => item.id), ['urgent-new', 'urgent-old', 'routine', 'important']);
  assert.deepEqual(items, original, 'sorting must not mutate the shared content cache');
  assert.equal(ordered.length, items.length, 'every published notice remains available');
});

test('without urgent notices the feed stays newest first', () => {
  assert.deepEqual(orderAnnouncements([
    { id: 'old', priority: 'normal', publishedAt: '2026-11-09T12:00:00Z' },
    { id: 'new', priority: 'normal', publishedAt: '2026-11-10T12:00:00Z' },
  ]).map(item => item.id), ['new', 'old']);
  assert.deepEqual(orderAnnouncements([]), []);
});
