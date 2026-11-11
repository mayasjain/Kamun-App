import { supabase } from './supabase';
import { clearMemeCache } from './meme-cache';

export type MemeVote = -1 | 0 | 1;
export type MemeActivity = { meme_id: string; upvotes: number; downvotes: number; my_vote: MemeVote; comment_count: number };
export type MemeComment = { id: string; body: string; author_label: string; created_at: string; is_own: boolean; can_remove: boolean };
function client() { if (!supabase) throw new Error('The gallery is not configured.'); return supabase; }
function fail(error: { message: string } | null) { if (error) throw new Error(error.message); }
export async function loadMemeActivity(ids: string[]): Promise<MemeActivity[]> {
 if (!ids.length) return [];
 const { data, error } = await client().rpc('get_meme_activity', { p_ids: ids });
 fail(error);
 return data ?? [];
}
export async function voteOnMeme(id: string, value: MemeVote) {
 const { error } = await client().rpc('set_meme_vote', { p_meme_id: id, p_value: value }).abortSignal(AbortSignal.timeout(8000));
 fail(error); clearMemeCache();
}
export async function loadMemeComments(id: string, before?: Pick<MemeComment, 'created_at' | 'id'>): Promise<MemeComment[]> {
 const { data, error } = await client().rpc('list_meme_comments', {
  p_meme_id: id, p_before: before?.created_at ?? null, p_before_id: before?.id ?? null,
 });
 fail(error);
 return data ?? [];
}
export async function addMemeComment(id: string, body: string) {
 const { error } = await client().rpc('add_meme_comment', { p_meme_id: id, p_body: body.trim() });
 fail(error); clearMemeCache();
}
export async function removeMemeComment(id: string) {
 const { data, error } = await client().rpc('remove_meme_comment', { p_comment_id: id });
 fail(error);
 if (!data) throw new Error('This comment could not be removed. Refresh and try again.');
 clearMemeCache();
}

// Coalesce the visible cards into one totals request per polling tick.
let liveBatch: { id: string; resolve: (row: MemeActivity | undefined) => void; reject: (error: unknown) => void }[] = [];
export function loadLiveMemeActivity(id: string): Promise<MemeActivity | undefined> {
 return new Promise((resolve, reject) => {
  liveBatch.push({ id, resolve, reject });
  if (liveBatch.length !== 1) return;
  setTimeout(() => {
   const batch = liveBatch;
   liveBatch = [];
   const ids = [...new Set(batch.map(item => item.id))];
   const pages: Promise<MemeActivity[]>[] = [];
   for (let offset = 0; offset < ids.length; offset += 24) pages.push(loadMemeActivity(ids.slice(offset, offset + 24)));
   void Promise.all(pages).then(pages => {
    const rows = pages.flat();
    for (const item of batch) item.resolve(rows.find(row => row.meme_id === item.id));
   }, error => { for (const item of batch) item.reject(error); });
  }, 30);
 });
}
