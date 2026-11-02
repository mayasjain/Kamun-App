import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRememberedAccess } from '../src/lib/remembered-access.ts';

const france = { committee: 'ILO', seat: 'France' };
const germany = { committee: 'ILO', seat: 'Germany' };
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
function setup(restore, initial = france) {
  let stored = initial;
  const session = createRememberedAccess({ read: () => stored, write: (value) => { stored = value; },
    restore, expired: (error) => error.message === 'revoked' });
  return { session, stored: () => stored };
}

test('reopening displays the saved identity immediately, then verifies it', async () => {
  const request = deferred();
  const { session, stored } = setup(() => request.promise);
  const pending = session.restore();
  assert.equal(session.getSnapshot().profile, france);
  assert.equal(session.getSnapshot().isLoading, false);
  request.resolve(germany);
  await pending;
  assert.equal(session.getSnapshot().profile, germany);
  assert.equal(stored(), germany);
});

test('offline restoration preserves saved access and recovers without another code', async () => {
  let offline = true;
  const { session, stored } = setup(async () => { if (offline) throw new Error('offline'); return france; });
  await session.restore();
  assert.equal(session.getSnapshot().profile, france);
  assert.equal(stored(), france);
  assert.match(session.getSnapshot().restoreError, /saved information/);
  offline = false;
  await session.restore();
  assert.equal(session.getSnapshot().restoreError, null);
});

test('confirmed revoked access clears the saved profile', async () => {
  const { session, stored } = setup(async () => { throw new Error('revoked'); });
  await session.restore();
  assert.equal(session.getSnapshot().profile, null);
  assert.equal(stored(), null);
});

test('late restore cannot undo explicit logout', async () => {
  const request = deferred();
  const { session, stored } = setup(() => request.promise);
  const pending = session.restore();
  session.clear();
  request.resolve(france);
  await pending;
  assert.equal(session.getSnapshot().profile, null);
  assert.equal(stored(), null);
});

test('late failed restore cannot erase a newly signed-in identity', async () => {
  const request = deferred();
  const { session, stored } = setup(() => request.promise);
  const pending = session.restore();
  session.save(germany);
  request.reject(new Error('revoked'));
  await pending;
  assert.equal(session.getSnapshot().profile, germany);
  assert.equal(stored(), germany);
});

test('foreground and timer share a pending verification request', async () => {
  const request = deferred();
  let calls = 0;
  const { session } = setup(() => { calls++; return request.promise; });
  const first = session.restore();
  const second = session.restore();
  assert.equal(calls, 1);
  request.resolve(france);
  await Promise.all([first, second]);
});

test('restores the auth session even when the profile cache is missing', async () => {
  const { session, stored } = setup(async () => france, null);
  await session.restore();
  assert.equal(stored(), france);
});
