import { RemoveConfirmation } from '@/components/remove-confirmation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useMemePostingCommittees } from '@/hooks/use-meme-posting-committees';
import { usePadletPoll } from '@/hooks/use-padlet-poll';
import { cachedMemes } from '@/lib/meme-cache';
import { MemeSlideshow } from '@/components/meme-slideshow';
import { MemeDiscussion } from '@/components/meme-discussion';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useAttendeeProfile } from '@/contexts/attendee-profile';
import { useConferenceContent } from '@/contexts/conference-content';
import { useTheme } from '@/hooks/use-theme';
import { CHAIRS_GALLERY, loadMemes, postMeme, removeMeme, type Meme } from '@/lib/committee-memes';

export default function MemesScreen() {
 const theme = useTheme();
 const { height: windowHeight } = useWindowDimensions();
 const { profile } = useAttendeeProfile();
 const postingCommittees = useMemePostingCommittees(profile);
 const { content } = useConferenceContent();
 const committees = content?.committees ?? [];
 const [slides, setSlides] = useState<Meme[] | null>(null);
 const [preparingSlides, setPreparingSlides] = useState(false);
 const [filter, setFilter] = useState<string | null>(null);
 const [memes, setMemes] = useState<Meme[]>([]);
 const [loading, setLoading] = useState(true);
 const [more, setMore] = useState(false);
 const [error, setError] = useState('');
 const [notice, setNotice] = useState('');
 const [composing, setComposing] = useState(false);
 const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
 const isChair = profile?.accessType === 'chair' || profile?.accessType === 'admin';
 const destination = filter === CHAIRS_GALLERY && !isChair ? null : filter;
 const canPost = !!profile && (profile.accessType === 'admin' || destination === null || destination === profile.committeeId || (destination !== null && postingCommittees.ids.includes(destination)) || (destination === CHAIRS_GALLERY && isChair));
 const destinationName = destination === CHAIRS_GALLERY ? 'Chairs' : committees.find(c => c.id === destination)?.abbreviation ?? 'General';
 const [caption, setCaption] = useState('');
 const [busy, setBusy] = useState(false);
 const [action, setAction] = useState<Meme | null>(null);
 const request = useRef(0);
 const mutation = useRef(false);
 const fullscreenOwned = useRef(false);
 function closeSlideshow() {
  setSlides(null);
  if (Platform.OS === 'web' && fullscreenOwned.current) {
   fullscreenOwned.current = false;
   if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  }
 }
 const refresh = useCallback(async (before?: string) => {
  if (!profile) return;
  const version = ++request.current;
  setLoading(true); setError('');
  try {
   const rows = await loadMemes(profile.conferenceId, destination, before);
   if (version !== request.current) return;
   setMemes(old => before ? [...old, ...rows.filter(row => !old.some(m => m.id === row.id))] : rows);
   setMore(rows.length === 24);
  } catch { if (version === request.current) setError('Could not load the gallery. Check your connection and try again.'); }
  finally { if (version === request.current) setLoading(false); }
 }, [profile, destination, request]);
 useEffect(() => {
  let active = true;
  const invalidate = () => { request.current++; };
  void Promise.resolve().then(() => {
   if (!active) return;
   const cached = profile ? cachedMemes(profile.conferenceId, destination) : null;
   setMemes(cached ?? []);
   setMore(cached?.length === 24);
   void refresh();
  });
  return () => { active = false; invalidate(); };
 }, [refresh, request, profile, destination]);
 // Refresh short-lived image URLs while the gallery is open.
 useEffect(() => { const timer = setInterval(() => void refresh(), 4 * 60 * 1000); return () => clearInterval(timer); }, [refresh]);
 usePadletPoll(async () => {
  if (!profile || loading || mutation.current) return;
  const version = request.current;
  const rows = await loadMemes(profile.conferenceId, destination, undefined, true);
  if (version !== request.current) return;
  setMore(rows.length === 24);
  setMemes(old => {
   const oldest = rows.at(-1)?.created_at;
   const older = rows.length === 24 && oldest ? old.filter(m => m.created_at < oldest) : [];
   return [...rows.map(row => ({ ...row, activity: old.find(m => m.id === row.id)?.activity ?? row.activity })), ...older];
  });
 }, !!profile);
 async function startSlideshow() {
  if (!profile || preparingSlides) return;
  if (Platform.OS === 'web' && !document.fullscreenElement && document.documentElement.requestFullscreen) {
   void document.documentElement.requestFullscreen().then(() => { fullscreenOwned.current = true; }).catch(() => {});
  }
  setPreparingSlides(true); setError('');
  let started = false;
  const version = request.current;
  try {
   const all: Meme[] = [];
   let before: string | undefined;
   while (true) {
    const page = await loadMemes(profile.conferenceId, destination, before);
    if (version !== request.current) return;
    all.push(...page.filter(row => !all.some(old => old.id === row.id)));
    const cursor = page.at(-1)?.created_at;
    if (page.length < 24 || !cursor || cursor === before) break;
    before = cursor;
   }
   if (all.length) { setSlides(all.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || a.id.localeCompare(b.id))); started = true; }
   else setNotice('No memes in this section yet.');
  } catch { setError('Could not prepare the slideshow. Please try again.'); }
  finally { setPreparingSlides(false); if (!started) closeSlideshow(); }
 }
 function choices(value: string | null, change: (id: string) => void) {
  return committees.map(c => <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={c.name} accessibilityState={{ selected: value === c.id, disabled: busy }} disabled={busy} onPress={() => change(c.id)} style={({ pressed }) => [styles.chip, { backgroundColor: value === c.id ? theme.primary : theme.backgroundElement, borderColor: theme.border }, pressed && { opacity: 0.65 }]}><ThemedText type="smallBold" style={{ color: value === c.id ? theme.onPrimary : theme.text }}>{c.abbreviation}</ThemedText></Pressable>);
 }
 async function pick() {
  setError('');
  try {
   const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
   if (!result.canceled) setPhoto(result.assets[0]);
  } catch { setError('Could not open your photos. Please try again.'); }
 }
 async function post() {
  if (!profile || !photo || !canPost || mutation.current) return;
  mutation.current = true;
  setBusy(true); setError('');
  try {
   await postMeme(profile.conferenceId, destination, photo, caption);
   setComposing(false); setPhoto(null); setCaption(''); setNotice('');
   await refresh();
  } catch (e) { setError(e instanceof Error ? e.message : 'Could not post your meme. Please try again.'); }
  finally { mutation.current = false; setBusy(false); }
 }
 async function confirmAction() {
  if (!action || mutation.current) return;
  mutation.current = true;
  setBusy(true); setError('');
  try {
   await removeMeme(action);
   setMemes(old => old.filter(m => m.id !== action.id));
   setNotice('Meme removed.');
   setAction(null);
  } catch { setError('Could not complete that action. Check your connection and try again.'); }
  finally { mutation.current = false; setBusy(false); }
 }
 return <Screen eyebrow="" title={composing ? 'New meme' : 'Committee memes'} subtitle={composing ? `Posting to ${destinationName}` : 'Memes from every committee, all in one place.'} onRefresh={() => void refresh()} refreshing={loading && memes.length > 0}>
  {slides && (!slides.some(m => m.chairs_only) || isChair) && <MemeSlideshow slides={slides} title={destinationName} onClose={closeSlideshow} />}
  {!composing && canPost && <ActionButton label={'Meme the Moment'} onPress={() => { setComposing(true); setAction(null); setNotice(''); setError(''); }} primary={true} />}
  {!composing && !canPost && <ThemedText themeColor="textSecondary">You can browse this gallery. To post, select General, your own committee or your assigned reporting committee.</ThemedText>}
  {postingCommittees.failed && <View accessibilityLiveRegion="polite" style={styles.panel}>
   <ThemedText themeColor="textSecondary">Could not check assigned committee posting access. Your usual galleries are still available.</ThemedText>
   <ActionButton label="Retry posting access" onPress={postingCommittees.retry} />
  </View>}
  {notice ? <ThemedText accessibilityLiveRegion="polite" themeColor="primary">{notice}</ThemedText> : null}
  {composing ? <View style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
   <ThemedText themeColor="textSecondary">Keep it kind and only share photos you have permission to post.</ThemedText>
   {photo && <Image source={{ uri: photo.uri }} accessibilityLabel="Selected meme preview" style={[styles.image, { height: Math.min(220, windowHeight * 0.28), maxWidth: 360, alignSelf: 'center' }]} resizeMode="contain" />}
   {<ActionButton label={photo ? 'Choose another photo' : 'Choose a photo'} onPress={() => void pick()} primary={false} disabled={busy} />}
   <ThemedText type="small" themeColor="textSecondary">JPG, PNG or WebP · up to 8 MB</ThemedText>
   <ThemedText type="smallBold">Caption (optional)</ThemedText>
   <TextInput accessibilityLabel="Caption (optional)" value={caption} onChangeText={setCaption} maxLength={180} multiline editable={!busy} placeholder="A little context…" placeholderTextColor={theme.textSecondary} style={[styles.input, { color: theme.text, borderColor: theme.border }]} />
   <ThemedText type="small" themeColor="textSecondary">{caption.length}/180</ThemedText>

   {<ActionButton label={busy ? 'Posting…' : 'Post the meme'} onPress={() => void post()} primary={true} disabled={busy || !photo || !canPost} />}
   {<ActionButton label={'Cancel'} onPress={() => setComposing(false)} primary={false} disabled={busy} />}
  </View> : null}
  {error ? <View accessibilityLiveRegion="polite" style={styles.panel}><ThemedText themeColor="danger">{error}</ThemedText>{!composing && !action && <ActionButton label={'Try again'} onPress={() => void refresh()} />}</View> : null}
  {!composing && <>
  <View style={styles.chips}><Pressable accessibilityRole="button" accessibilityState={{ selected: destination === null }} onPress={() => setFilter(null)} style={[styles.chip, { backgroundColor: destination === null ? theme.primary : theme.backgroundElement, borderColor: theme.border }]}><ThemedText type="smallBold" style={{ color: destination === null ? theme.onPrimary : theme.text }}>General</ThemedText></Pressable>{isChair && <Pressable accessibilityRole="button" accessibilityLabel="Chairs gallery" accessibilityState={{ selected: destination === CHAIRS_GALLERY }} onPress={() => setFilter(CHAIRS_GALLERY)} style={[styles.chip, { backgroundColor: destination === CHAIRS_GALLERY ? theme.primary : theme.backgroundElement, borderColor: theme.border }]}><ThemedText type="smallBold" style={{ color: destination === CHAIRS_GALLERY ? theme.onPrimary : theme.text }}>Chairs</ThemedText></Pressable>}{choices(destination, setFilter)}</View>
  <ActionButton label={preparingSlides ? 'Preparing slideshow…' : 'Slideshow'} onPress={() => void startSlideshow()} disabled={preparingSlides || loading || !memes.length} />
  {loading && !memes.length ? <View style={styles.panel}><ActivityIndicator color={theme.primary} /><ThemedText>Loading the latest laughs…</ThemedText></View> : null}
  {!loading && !error && !memes.length ? <View style={[styles.panel, { backgroundColor: theme.primarySoft }]}><ThemedText type="subtitle">No memes yet</ThemedText><ThemedText themeColor="textSecondary">{!canPost ? 'Check back soon for memes from this committee.' : destination === CHAIRS_GALLERY ? 'Share a laugh with the chairs.' : destination ? 'Share a laugh with this committee.' : 'Share a laugh to get things started.'}</ThemedText></View> : null}
  {memes.filter(m => destination === CHAIRS_GALLERY ? isChair && m.chairs_only : !m.chairs_only && m.committee_id === destination).map(m => <View key={m.id} style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
   <View style={styles.cardBody}><ThemedText type="smallBold" themeColor="primary">{m.chairs_only ? 'Chairs' : committees.find(c => c.id === m.committee_id)?.abbreviation ?? 'General'}</ThemedText><ThemedText type="small" themeColor="textSecondary">{new Date(m.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}{m.is_own ? ' · Your meme' : ''}</ThemedText></View>
   <MemePhoto key={m.imageUrl} meme={m} />
   <View style={styles.cardBody}>{m.caption ? <ThemedText>{m.caption}</ThemedText> : null}
    <MemeDiscussion meme={m} onActivity={activity => setMemes(old => old.map(row => row.id === m.id ? { ...row, activity } : row))} />
    {m.can_remove && <RemoveConfirmation confirming={action?.id === m.id} prompt="Remove this meme from the gallery?" label="Remove meme" busy={busy && action?.id === m.id} disabled={busy}
      onStart={() => setAction(m)} onConfirm={() => void confirmAction()} onCancel={() => setAction(null)} />}
   </View>
  </View>)}
  {more && <ActionButton label={loading ? 'Loading…' : 'Load more memes'} onPress={() => void refresh(memes[memes.length - 1]?.created_at)} primary={false} disabled={loading} />}
  </>}
 </Screen>;
}
function ActionButton({ label, onPress, primary = false, disabled = false }: { label: string; onPress: () => void; primary?: boolean; disabled?: boolean }) {
 const theme = useTheme();
 return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: primary ? theme.primary : theme.primarySoft }, (pressed || disabled) && { opacity: 0.55 }]}><ThemedText type="smallBold" style={{ color: primary ? theme.onPrimary : theme.primary }}>{label}</ThemedText></Pressable>;
}
function MemePhoto({ meme }: { meme: Meme }) {
 const [failed, setFailed] = useState(false);
 const { height } = useWindowDimensions();
 return failed || !meme.imageUrl ? <View style={styles.panel}><ThemedText>Photo unavailable. Pull to refresh and try again.</ThemedText></View> : <Image source={{ uri: meme.imageUrl }} accessibilityLabel={meme.caption || 'Committee meme'} resizeMode="contain" style={[styles.image, { height: Math.min(420, height * 0.5) }]} onError={() => setFailed(true)} />;
}
const styles = StyleSheet.create({
 button: { borderRadius: 16, minHeight: 48, paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
 chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
 chip: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, borderWidth: 1, justifyContent: 'center' },
 panel: { borderRadius: 24, padding: 20, gap: 16, borderWidth: 0 },
 input: { borderWidth: 1, borderRadius: 12, minHeight: 88, padding: 14, fontSize: 16, textAlignVertical: 'top' },
 image: { width: '100%', borderRadius: 12 },
 card: { borderWidth: 1, borderRadius: 28, overflow: 'hidden', marginBottom: 8 },
 cardBody: { padding: 18, gap: 12 },
});
