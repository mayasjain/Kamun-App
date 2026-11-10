import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createNavigationScrollTracker } from '../src/lib/navigation-scroll.ts';

test('shrinks down the page, ignores jitter, and expands on an upward scroll', () => {
  const scroll = createNavigationScrollTracker();
  assert.equal(scroll(40, 1000), false);
  assert.equal(scroll(100, 1000), true);
  assert.equal(scroll(98, 1000), true);
  assert.equal(scroll(103, 1000), true);
  assert.equal(scroll(95, 1000), true);
  assert.equal(scroll(90, 1000), false);
});

test('rubber-band overscroll at the bottom cannot falsely expand the bar', () => {
  const scroll = createNavigationScrollTracker();
  assert.equal(scroll(500, 500), true);
  assert.equal(scroll(540, 500), true);
  assert.equal(scroll(500, 500), true);
  assert.equal(scroll(480, 500), false);
});

test('the top always expands and non-scrollable pages stay expanded', () => {
  const scroll = createNavigationScrollTracker();
  assert.equal(scroll(200, 500), true);
  assert.equal(scroll(0, 500), false);
  assert.equal(scroll(-30, 500), false);
  assert.equal(scroll(5, 500), false);
  assert.equal(createNavigationScrollTracker()(300, 0), false);
});
