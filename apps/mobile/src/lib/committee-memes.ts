import { File } from 'expo-file-system';
import { Platform } from 'react-native';
import type { ImagePickerAsset } from 'expo-image-picker';
import { supabase } from './supabase';
import { cacheMemes, clearMemeCache, memeCacheGeneration } from './meme-cache';

export type Meme = { id: string; committee_id: string | null; image_path: string; caption: string; created_at: string; is_own: boolean; can_remove: boolean; imageUrl: string };
const bucket = 'committee-memes';
function client() { if (!supabase) throw new Error('The gallery is not configured.'); return supabase; }
export async function loadMemes(conferenceId: string, committeeId: string | null, before?: string): Promise<Meme[]> {
 const db = client();
 const generation = memeCacheGeneration();
 const { data, error } = await db.rpc('list_committee_memes', { p_conference_id: conferenceId, p_committee_id: committeeId, p_before: before ?? null });
 if (error) throw error;
 if (!data?.length) { if (!before) cacheMemes(conferenceId, committeeId, [], Date.now(), generation); return []; }
 const rows = data.filter((m: Meme) => m.committee_id === committeeId);
 if (!rows.length) return [];
 const [permission, images] = await Promise.all([
  db.rpc('can_moderate_meme_gallery', { p_conference_id: conferenceId, p_committee_id: committeeId }),
  db.storage.from(bucket).createSignedUrls(rows.map((m: Meme) => m.image_path), 300),
 ]);
 if (permission.error) throw permission.error;
 if (images.error) throw images.error;
 const urls = new Map(images.data?.map(u => [u.path, u.signedUrl]));
 const result = rows.map((m: Meme) => ({ ...m, can_remove: permission.data === true, imageUrl: urls.get(m.image_path) ?? '' }));
 if (!before) cacheMemes(conferenceId, committeeId, result, Date.now(), generation);
 return result;
}
export async function postMeme(conferenceId: string, committeeId: string | null, asset: ImagePickerAsset, caption: string) {
 const db = client();
 const { data: { user }, error: authError } = await db.auth.getUser();
 if (authError || !user) throw new Error('Sign in again to post a meme.');
 if (asset.fileSize && asset.fileSize > 8 * 1024 * 1024) throw new Error('Choose a photo smaller than 8 MB.');
 const bytes = Platform.OS === 'web' ? await (await fetch(asset.uri)).arrayBuffer() : await new File(asset.uri).arrayBuffer();
 if (bytes.byteLength > 8 * 1024 * 1024) throw new Error('Choose a photo smaller than 8 MB.');
 const type = asset.mimeType ?? 'image/jpeg';
 if (!['image/jpeg','image/png','image/webp'].includes(type)) throw new Error('Choose a JPG, PNG or WebP photo.');
 const path = `${user.id}/${conferenceId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${type.split('/')[1]}`;
 const { error } = await db.storage.from(bucket).upload(path, bytes, { contentType: type, upsert: false });
 if (error) throw error;
 const { error: postError } = await db.rpc('post_committee_meme', { p_conference_id: conferenceId, p_committee_id: committeeId, p_image_path: path, p_caption: caption });
 if (postError) { await db.storage.from(bucket).remove([path]); throw postError; }
 clearMemeCache();
}
export async function removeMeme(meme: Meme) {
 const db = client();
 const { data, error } = await db.rpc('remove_committee_meme', { p_id: meme.id });
 if (error) throw error;
 if (!data) throw new Error('This meme could not be removed.');
 clearMemeCache();
 // Moderation soft-removes the post; private image access expires with signed URLs.
}
