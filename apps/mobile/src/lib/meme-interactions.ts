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
 const { error } = await client().rpc('set_meme_vote', { p_meme_id: id, p_value: value });
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
