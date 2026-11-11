import { File } from 'expo-file-system';
import { Platform } from 'react-native';
import type { ImagePickerAsset } from 'expo-image-picker';
import { supabase } from './supabase';
import { cacheMemes, clearMemeCache, memeCacheGeneration } from './meme-cache';
import { loadMemeActivity, type MemeActivity } from './meme-interactions';

export const CHAIRS_GALLERY = 'chairs';
export type Meme = { chairs_only?: boolean; id: string; committee_id: string | null; image_path: string; caption: string; created_at: string; is_own: boolean; can_remove: boolean; imageUrl: string; activity?: MemeActivity | null };
const bucket = 'committee-memes';
const imageUrls = new Map<string, { url: string; expires: number }>();
function client() { if (!supabase) throw new Error('The gallery is not configured.'); return supabase; }
export async function loadMemes(conferenceId: string, committeeId: string | null, before?: string, live = false): Promise<Meme[]> {
 const db = client();
 const generation = memeCacheGeneration();
 const chairs = committeeId === CHAIRS_GALLERY;
 const { data, error } = chairs
  ? await db.rpc('list_chair_memes', { p_conference_id: conferenceId, p_before: before ?? null })
  : await db.rpc('list_committee_memes', { p_conference_id: conferenceId, p_committee_id: committeeId, p_before: before ?? null });
 if (error) throw error;
 if (!data?.length) { if (!before) cacheMemes(conferenceId, committeeId, [], Date.now(), generation); return []; }
 const rows = data.filter((m: Meme) => chairs ? m.committee_id === null : m.committee_id === committeeId);
 if (!rows.length) return [];
 const missingImages = rows.filter((m: Meme) => !live || (imageUrls.get(m.image_path)?.expires ?? 0) <= Date.now());
 const [permission, images, activity] = await Promise.all([
  db.rpc('can_moderate_meme_gallery', { p_conference_id: conferenceId, p_committee_id: chairs ? null : committeeId }),
  missingImages.length ? db.storage.from(bucket).createSignedUrls(missingImages.map((m: Meme) => m.image_path), 300) : Promise.resolve({ data: [], error: null }),
  // Keep photos available during backend rollout or an interaction-service error.
  live ? Promise.resolve([]) : loadMemeActivity(rows.map((m: Meme) => m.id)).catch(() => []),
 ]);
 if (permission.error) throw permission.error;
 if (images.error) throw images.error;
 for (const [path, entry] of imageUrls) if (entry.expires <= Date.now()) imageUrls.delete(path);
 for (const image of images.data ?? []) if (image.path && image.signedUrl) imageUrls.set(image.path, { url: image.signedUrl, expires: Date.now() + 240000 });
 const result = rows.map((m: Meme) => ({ ...m, chairs_only: chairs, can_remove: permission.data === true, imageUrl: imageUrls.get(m.image_path)?.url ?? '', activity: activity.find(a => a.meme_id === m.id) ?? null }));
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
 const { data: path, error: reservationError } = await db.rpc('reserve_meme_upload', {
  p_conference_id: conferenceId, p_content_type: type,
 });
 if (reservationError) throw reservationError;
 if (typeof path !== 'string' || !path) throw new Error('Could not reserve an image upload. Try again.');
 const { error } = await db.storage.from(bucket).upload(path, bytes, { contentType: type, upsert: false });
 if (error) throw error;
 const { error: postError } = committeeId === CHAIRS_GALLERY
  ? await db.rpc('post_chair_meme', { p_conference_id: conferenceId, p_image_path: path, p_caption: caption })
  : await db.rpc('post_committee_meme', { p_conference_id: conferenceId, p_committee_id: committeeId, p_image_path: path, p_caption: caption });
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
