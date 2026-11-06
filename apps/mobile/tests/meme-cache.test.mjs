import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cacheMemes, cachedMemes, clearMemeCache, memeCacheGeneration } from '../src/lib/meme-cache.ts';

test('gallery cache isolates conferences and General from committees, and expires', () => {
 clearMemeCache();
 const rows = [{ id: 'one' }];
 cacheMemes('conference', null, rows, 1000);
 assert.equal(cachedMemes('conference', null, 1001), rows);
 assert.equal(cachedMemes('other', null, 1001), null);
 assert.equal(cachedMemes('conference', 'unsc', 1001), null);
 assert.equal(cachedMemes('conference', null, 121000), null);
});

test('access changes clear cache and prevent stale requests from repopulating it', () => {
 const oldGeneration = memeCacheGeneration();
 cacheMemes('conference', null, [], 1000);
 clearMemeCache();
 assert.equal(cachedMemes('conference', null, 1001), null);
 cacheMemes('conference', null, [{ id: 'old-session' }], 1000, oldGeneration);
 assert.equal(cachedMemes('conference', null, 1001), null);
});
