import { usePadletPoll } from '@/hooks/use-padlet-poll';
import { RemoveConfirmation } from './remove-confirmation';
import { MemeActionIcon } from './meme-action-icon';
import { createMemeVoteQueue } from '@/lib/meme-vote-queue';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { Meme } from '@/lib/committee-memes';
import { addMemeComment, loadLiveMemeActivity, loadMemeActivity, loadMemeComments, removeMemeComment, voteOnMeme, type MemeActivity, type MemeComment } from '@/lib/meme-interactions';

export function MemeDiscussion({ meme, onActivity }: { meme: Meme; onActivity: (activity: MemeActivity) => void }) {
 const theme = useTheme();
 const [expanded, setExpanded] = useState(false);
 const [comments, setComments] = useState<MemeComment[]>([]);
 const [hasMore, setHasMore] = useState(false);
 const [draft, setDraft] = useState('');
 const [loading, setLoading] = useState(false);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
 const locked = useRef(false);
 const revision = useRef(0);
 const alive = useRef(true);
 useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
 const activity = meme.activity;
 const latest = useRef({ activity, onActivity });
 useEffect(() => { latest.current = { activity, onActivity }; }, [activity, onActivity]);
 const voteQueue = useRef<ReturnType<typeof createMemeVoteQueue> | null>(null);
 function getVoteQueue() {
  return voteQueue.current ??= createMemeVoteQueue({
  current: () => latest.current.activity ?? undefined,
  publish: next => {
   latest.current.activity = next;
   if (alive.current) latest.current.onActivity(next);
  },
  save: value => voteOnMeme(meme.id, value),
  onError: () => { if (alive.current) setError('Couldn’t save your vote. Try again.'); },
  });
 }
 async function refreshActivity() {
  const rows = await loadMemeActivity([meme.id]);
  if (!rows[0]) throw new Error('This meme is no longer available. Refresh the gallery.');
  if (alive.current) {
   const current = latest.current.activity;
   onActivity(voteQueue.current?.pending && current ? { ...rows[0], my_vote: current.my_vote, upvotes: current.upvotes, downvotes: current.downvotes } : rows[0]);
  }
 }
 usePadletPoll(async () => {
  if (locked.current) return;
  const version = revision.current;
  const row = await loadLiveMemeActivity(meme.id);
  if (!alive.current || version !== revision.current || locked.current) return;
  if (row && !voteQueue.current?.pending) latest.current.onActivity(row);
  if (!expanded) return;
  // Refresh every loaded page so older comments stay visible and removals disappear.
  const rows: MemeComment[] = [];
  let page: MemeComment[];
  do {
   page = await loadMemeComments(meme.id, rows.at(-1));
   rows.push(...page);
  } while (page.length === 20 && rows.length < comments.length);
  if (alive.current && !locked.current && version === revision.current) { setComments(rows); setHasMore(page.length === 20); }
 });
 async function loadComments(more = false) {
  if (locked.current) return;
  revision.current++;
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
  revision.current++;
  locked.current = true; setBusy(true); setError('');
  let committed = false;
  try {
   await operation(); committed = true;
   if (!alive.current) return;
   if (clearDraft) setDraft('');
   setConfirmRemove(null);
   await refreshActivity();
   if (expanded) {
    const rows = await loadMemeComments(meme.id);
    if (alive.current) { setComments(rows); setHasMore(rows.length === 20); }
   }
  } catch (e) {
   if (alive.current) setError(committed ? `${saved} Could not refresh. Try refreshing the gallery.` : e instanceof Error ? e.message : 'Could not save. Try again.');
  } finally { locked.current = false; if (alive.current) setBusy(false); }
 }
 function vote(value: -1 | 1) {
  revision.current++;
  setError('');
  getVoteQueue().toggle(value);
 }
 return <View style={[styles.section, { borderTopColor: theme.border }]}>
  {activity ? <View style={styles.row}>
   <View style={[styles.votes, { backgroundColor: theme.primarySoft }]}>
    <ActionButton icon={activity.my_vote === 1 ? 'arrow-up' : 'arrow-up-outline'} label="Upvote" count={activity.upvotes} onPress={() => vote(1)} selected={activity.my_vote === 1} />
    <View style={[styles.voteDivider, { backgroundColor: theme.border }]} />
    <ActionButton icon={activity.my_vote === -1 ? 'arrow-down' : 'arrow-down-outline'} label="Downvote" count={activity.downvotes} onPress={() => vote(-1)} selected={activity.my_vote === -1} />
   </View>
   <ActionButton icon="chatbubble-outline" label="Comments" count={activity.comment_count} expanded={expanded} onPress={() => { setExpanded(!expanded); if (!expanded) void loadComments(); }} />
  </View> : <View style={styles.row}><ThemedText type="small" themeColor="textSecondary">Votes and comments are unavailable.</ThemedText><DiscussionButton label="Retry" onPress={() => void mutate(refreshActivity, 'Totals refreshed.')} disabled={busy || loading} /></View>}
  {error ? <ThemedText type="small" accessibilityLiveRegion="polite" themeColor="danger">{error}</ThemedText> : null}
  {expanded && activity && <View style={styles.thread}>
   <ThemedText type="smallBold">Comments {activity.comment_count}</ThemedText>
   <View style={styles.commentRow}>
    <Avatar label="You" />
    <View style={styles.commentContent}>
     <TextInput accessibilityLabel="Add a comment" placeholder="Add a comment…" placeholderTextColor={theme.textSecondary} value={draft} onChangeText={setDraft} maxLength={500} multiline editable={!busy} style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]} />
     {draft.length > 0 && <View style={styles.composerActions}>
      <DiscussionButton label="Cancel" onPress={() => setDraft('')} disabled={busy} />
      <DiscussionButton label={busy ? 'Posting…' : 'Comment'} onPress={() => void mutate(() => addMemeComment(meme.id, draft), 'Comment posted.', true)} disabled={busy || loading || !draft.trim()} filled />
     </View>}
    </View>
   </View>
   {loading && <ActivityIndicator color={theme.primary} accessibilityLabel="Loading comments" />}
   {!loading && !comments.length && !error && <ThemedText type="small" themeColor="textSecondary">No comments yet. Start the conversation.</ThemedText>}
   {comments.map(c => <View key={c.id} style={styles.commentRow}>
    <Avatar label={c.author_label} />
    <View style={styles.commentContent}>
     <View style={styles.metadata}>
      <ThemedText type="smallBold">{c.author_label}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">{new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</ThemedText>
     </View>
     <ThemedText style={styles.commentBody}>{c.body}</ThemedText>
     {c.can_remove && <RemoveConfirmation confirming={confirmRemove === c.id} prompt="Remove this comment?" label="Remove comment" busy={busy && confirmRemove === c.id} disabled={busy || loading}
       onStart={() => setConfirmRemove(c.id)} onConfirm={() => void mutate(() => removeMemeComment(c.id), 'Comment removed.')} onCancel={() => setConfirmRemove(null)} />}
    </View>
   </View>)}
   {hasMore && <DiscussionButton label="Older comments" onPress={() => void loadComments(true)} disabled={busy || loading} />}
  </View>}
 </View>;
}
function Avatar({ label }: { label: string }) {
 const theme = useTheme();
 return <View accessible={false} style={[styles.avatar, { backgroundColor: theme.primarySoft }]}><ThemedText type="smallBold" themeColor="primary">{label.trim().charAt(0).toUpperCase()}</ThemedText></View>;
}
function ActionButton({ icon, label, count, onPress, selected = false, expanded }: { icon: React.ComponentProps<typeof MemeActionIcon>['name']; label: string; count: number; onPress: () => void; selected?: boolean; expanded?: boolean }) {
 const theme = useTheme();
 return <Pressable accessibilityRole="button" accessibilityLabel={`${label}, ${count}`} accessibilityState={{ selected, ...(expanded === undefined ? {} : { expanded }) }} onPress={onPress} style={({ pressed }) => [styles.action, pressed && { opacity: 0.55 }]}>
  <MemeActionIcon name={icon} color={selected ? theme.primary : theme.text} />
  <ThemedText type="smallBold" style={{ color: selected ? theme.primary : theme.text }}>{count}</ThemedText>
 </Pressable>;
}
function DiscussionButton({ label, onPress, filled = false, disabled = false }: { label: string; onPress: () => void; filled?: boolean; disabled?: boolean }) {
 const theme = useTheme();
 return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, filled && { backgroundColor: theme.primary }, (pressed || disabled) && { opacity: 0.55 }]}>
  <ThemedText type="smallBold" style={{ color: filled ? theme.onPrimary : theme.textSecondary }}>{label}</ThemedText>
 </Pressable>;
}
const styles = StyleSheet.create({
 section: { borderTopWidth: 1, paddingTop: 8, gap: 12 },
 row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
 votes: { flexDirection: 'row', alignItems: 'center', borderRadius: 24, overflow: 'hidden' },
 voteDivider: { width: 1, height: 20 },
 action: { minHeight: 44, minWidth: 48, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 24 },
 button: { minHeight: 44, borderRadius: 24, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
 thread: { gap: 20, paddingTop: 4 },
 input: { minHeight: 44, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, fontSize: 16, textAlignVertical: 'top' },
 composerActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, paddingTop: 8 },
 commentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
 avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
 commentContent: { flex: 1, minWidth: 0, gap: 4 },
 metadata: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
 commentBody: { fontSize: 14, lineHeight: 21 },
});
