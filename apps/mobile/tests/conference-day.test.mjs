import assert from 'node:assert/strict';
import { test } from 'node:test';
import { conferenceDayLabel } from '../src/lib/conference-day.ts';

const conference = {
  startsAt: '2026-11-13T08:00:00+01:00',
  endsAt: '2026-11-15T18:00:00+01:00',
  timezone: 'Europe/Berlin',
};
const label = value => conferenceDayLabel(conference, Date.parse(value));

test('shows all three conference days, including before opening and after closing hours', () => {
  assert.equal(label('2026-11-13T00:00:00+01:00'), 'Day 1 - 13 Nov');
  assert.equal(label('2026-11-14T12:00:00+01:00'), 'Day 2 - 14 Nov');
  assert.equal(label('2026-11-15T23:59:59+01:00'), 'Day 3 - 15 Nov');
});

test('shows Day 0 before the conference, switches on Berlin midnight and falls back after it', () => {
  assert.equal(label('2026-11-09T12:00:00Z'), 'Day 0 - 9 Nov');
  assert.equal(label('2026-11-12T22:59:59Z'), 'Day 0 - 12 Nov');
  assert.equal(label('2026-11-12T23:00:00Z'), 'Day 1 - 13 Nov');
  assert.equal(label('2026-11-13T22:59:59Z'), 'Day 1 - 13 Nov');
  assert.equal(label('2026-11-13T23:00:00Z'), 'Day 2 - 14 Nov');
  assert.equal(label('2026-11-14T23:00:00Z'), 'Day 3 - 15 Nov');
  assert.equal(label('2026-11-15T23:00:00Z'), '13–15 NOV');
});

test('uses conference timezone even when device timezone differs', () => {
  const previous = process.env.TZ;
  try {
    for (const timezone of ['America/Los_Angeles', 'Asia/Tokyo']) {
      process.env.TZ = timezone;
      assert.equal(label('2026-11-13T23:00:00Z'), 'Day 2 - 14 Nov');
    }
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test('uses supplied dates and handles missing or invalid conference data', () => {
  assert.equal(conferenceDayLabel({ ...conference, startsAt: '2026-11-14T08:00:00+01:00' }, Date.parse('2026-11-15T12:00:00Z')), 'Day 2 - 15 Nov');
  assert.equal(conferenceDayLabel(undefined, Date.now()), '13–15 NOV');
  assert.equal(conferenceDayLabel({ ...conference, timezone: 'invalid' }, Date.now()), '13–15 NOV');
  assert.equal(conferenceDayLabel({ ...conference, startsAt: 'invalid' }, Date.now()), '13–15 NOV');
});
