import type { Meme } from './committee-memes';

// Memory only; expires before the private image URLs and clears on access changes.
let generation = 0;
export function memeCacheGeneration() { return generation; }
const galleries = new Map<string, { rows: Meme[]; expires: number }>();
const key = (conference: string, committee: string | null) => JSON.stringify([conference, committee]);
export function cachedMemes(conference: string, committee: string | null, now = Date.now()): Meme[] | null {
 const id = key(conference, committee);
 const entry = galleries.get(id);
 if (!entry) return null;
 if (entry.expires <= now) { galleries.delete(id); return null; }
 return entry.rows;
}
export function cacheMemes(conference: string, committee: string | null, rows: Meme[], now = Date.now(), expectedGeneration = generation) {
 if (expectedGeneration !== generation) return;
 if (galleries.size >= 20) galleries.clear();
 galleries.set(key(conference, committee), { rows, expires: now + 120000 });
}
export function clearMemeCache() { generation++; galleries.clear(); }
