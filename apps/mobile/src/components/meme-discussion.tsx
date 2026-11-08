import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { Meme } from '@/lib/committee-memes';
import { addMemeComment, loadMemeActivity, loadMemeComments, removeMemeComment, voteOnMeme, type MemeActivity, type MemeComment, type MemeVote } from '@/lib/meme-interactions';

export function MemeDiscussion({ meme, onActivity }: { meme: Meme; onActivity: (activity: MemeActivity) => void }) {
 const theme = useTheme();
 const [expanded, setExpanded] = useState(false);
 const [comments, setComments] = useState<MemeComment[]>([]);
 const [hasMore, setHasMore] = useState(false);
 const [draft, setDraft] = useState('');
 const [loading, setLoading] = useState(false);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 const [notice, setNotice] = useState('');
 const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
 const locked = useRef(false);
 const alive = useRef(true);
 useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
 const activity = meme.activity;
 async function refreshActivity() {
  const rows = await loadMemeActivity([meme.id]);
  if (!rows[0]) throw new Error('This meme is no longer available. Refresh the gallery.');
  if (alive.current) onActivity(rows[0]);
 }
 async function loadComments(more = false) {
  if (locked.current) return;
  locked.current = true; setLoading(true); setError('');
  try {
   const rows = await loadMemeComments(meme.id, more ? comments.at(-1) : undefined);
   if (!alive.current) return;
   setComments(old => more ? [...old, ...rows.filter(r => !old.some(c => c.id === r.id))] : rows);
   setHasMore(rows.length === 20);
  } catch (e) { if (alive.current) setError(e instanceof Error ? e.message : 'Could not load comments. Try again.'); }
  finally { locked.current = false; if (alive.current) setLoading(false); }
 }
 async function mutate(operation: () => Promise<void>, saved: string, clearDraft = false) {
  if (locked.current) return;
  locked.current = true; setBusy(true); setError(''); setNotice('');
  let committed = false;
  try {
   await operation(); committed = true;
   if (!alive.current) return;
   if (clearDraft) setDraft('');
   setConfirmRemove(null); setNotice(saved);
   await refreshActivity();
   if (expanded) {
    const rows = await loadMemeComments(meme.id);
    if (alive.current) { setComments(rows); setHasMore(rows.length === 20); }
   }
  } catch (e) {
   if (alive.current) setError(committed ? `${saved} Could not refresh. Try refreshing the gallery.` : e instanceof Error ? e.message : 'Could not save. Try again.');
  } finally { locked.current = false; if (alive.current) setBusy(false); }
 }
 function vote(value: MemeVote) {
  void mutate(() => voteOnMeme(meme.id, activity?.my_vote === value ? 0 : value), activity?.my_vote === value ? 'Vote removed.' : 'Vote saved.');
 }
 return <View style={[styles.section, { borderTopColor: theme.border }]}>
  {activity ? <View style={styles.row}>
   <DiscussionButton label={`↑ ${activity.upvotes} Upvotes`} onPress={() => vote(1)} selected={activity.my_vote === 1} disabled={busy || loading} />
   <DiscussionButton label={`↓ ${activity.downvotes} Downvotes`} onPress={() => vote(-1)} selected={activity.my_vote === -1} disabled={busy || loading} />
   <DiscussionButton label={`${activity.comment_count} Comments${expanded ? ' · Hide' : ''}`} onPress={() => { setExpanded(!expanded); if (!expanded) void loadComments(); }} selected={expanded} disabled={busy || loading} />
  </View> : <View style={styles.row}><ThemedText type="small" themeColor="textSecondary">Votes and comments are unavailable.</ThemedText><DiscussionButton label="Retry" onPress={() => void mutate(refreshActivity, 'Totals refreshed.')} disabled={busy || loading} /></View>}
  {busy && <ActivityIndicator color={theme.primary} accessibilityLabel="Saving" />}
  {notice ? <ThemedText type="small" accessibilityLiveRegion="polite" themeColor="primary">{notice}</ThemedText> : null}
  {error ? <ThemedText type="small" accessibilityLiveRegion="polite" themeColor="danger">{error}</ThemedText> : null}
  {expanded && activity && <View style={styles.thread}>
   <View style={styles.row}><ThemedText type="smallBold">Comments · newest first</ThemedText><DiscussionButton label="Refresh comments" onPress={() => void loadComments()} disabled={busy || loading} /></View>
   <ThemedText type="small" themeColor="textSecondary">Keep it kind. Comments are visible to attendees under your attendee label.</ThemedText>
   <TextInput accessibilityLabel="Write a comment" placeholder="Add to the conversation…" placeholderTextColor={theme.textSecondary} value={draft} onChangeText={setDraft} maxLength={500} multiline editable={!busy} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} />
   <View style={styles.row}><ThemedText type="small" themeColor="textSecondary">{draft.length}/500</ThemedText><DiscussionButton label="Post comment" onPress={() => void mutate(() => addMemeComment(meme.id, draft), 'Comment posted.', true)} disabled={busy || loading || !draft.trim()} /></View>
   {loading && <ActivityIndicator color={theme.primary} accessibilityLabel="Loading comments" />}
   {!loading && !comments.length && !error && <ThemedText type="small" themeColor="textSecondary">No comments yet. Start the conversation.</ThemedText>}
   {comments.map(c => <View key={c.id} style={[styles.comment, { borderColor: theme.border }]}>
    <ThemedText type="smallBold">{c.author_label}{c.is_own ? ' · You' : ''}</ThemedText>
    <ThemedText type="small" themeColor="textSecondary">{new Date(c.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</ThemedText>
    <ThemedText>{c.body}</ThemedText>
    {c.can_remove && (confirmRemove === c.id ? <View style={styles.thread}><ThemedText type="small">Remove this comment?</ThemedText><View style={styles.row}><DiscussionButton label="Yes, remove" onPress={() => void mutate(() => removeMemeComment(c.id), 'Comment removed.')} disabled={busy || loading} /><DiscussionButton label="Cancel" onPress={() => setConfirmRemove(null)} disabled={busy || loading} /></View></View> : <View style={styles.row}><DiscussionButton label="Remove comment" onPress={() => setConfirmRemove(c.id)} disabled={busy || loading} /></View>)}
   </View>)}
   {hasMore && <DiscussionButton label="Older comments" onPress={() => void loadComments(true)} disabled={busy || loading} />}
  </View>}
 </View>;
}
function DiscussionButton({ label, onPress, selected = false, disabled = false }: { label: string; onPress: () => void; selected?: boolean; disabled?: boolean }) {
 const theme = useTheme();
 return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: selected ? theme.primary : theme.primarySoft, borderColor: selected ? theme.primary : theme.border }, (pressed || disabled) && { opacity: 0.55 }]}>
  <ThemedText type="smallBold" style={{ color: selected ? theme.onPrimary : theme.primary }}>{label}</ThemedText>
 </Pressable>;
}
const styles = StyleSheet.create({
 section: { borderTopWidth: 1, paddingTop: 14, gap: 12 },
 row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
 button: { minHeight: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
 thread: { gap: 12 },
 input: { minHeight: 88, padding: 12, borderWidth: 1, borderRadius: 12, fontSize: 16, textAlignVertical: 'top' },
 comment: { gap: 6, borderTopWidth: 1, paddingTop: 12, paddingBottom: 4 },
});
