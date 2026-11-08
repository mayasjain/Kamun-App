import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAttendeeProfile } from '@/contexts/attendee-profile';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

type GossipStatus = 'new' | 'read' | 'dismissed';
type Gossip = { id: string; committee_id: string; message: string; status: GossipStatus; created_at: string };

export default function GossipScreen() {
  const theme = useTheme();
  const { profile } = useAttendeeProfile();
  const isChair = profile?.accessType === 'chair';
  const selectedCommittee = profile?.committeeId;
  const [message, setMessage] = useState('');
  const [inbox, setInbox] = useState<Gossip[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showDismissed, setShowDismissed] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    if (!isChair || !supabase) return;
    setLoading(true);
    try {
      const { data, error: loadError } = await supabase.rpc('my_chair_gossip');
      if (loadError) throw loadError;
      setInbox((data ?? []) as Gossip[]);
      setError('');
    } catch {
      setError('Could not load your committee inbox. Check that you used its chair code.');
    } finally {
      setLoading(false);
    }
  }, [isChair]);

  useEffect(() => {
    if (isChair) void Promise.resolve().then(() => refresh());
  }, [isChair, refresh]);

  async function submit() {
    const body = message.trim();
    if (!supabase || !profile || !selectedCommittee || body.length < 3 || body.length > 500 || busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const { error: submitError } = await supabase.rpc('submit_committee_gossip', {
        p_conference_id: profile.conferenceId,
        p_committee_id: selectedCommittee,
        p_message: body,
      });
      if (submitError) throw submitError;
      setMessage('');
      setNotice('Sent to the chairs. They will decide whether to read it aloud.');
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : '';
      setError(detail.includes('Submission limit') ? 'You have sent several messages recently. Please try again later.' : 'Could not send your message. Check your connection and delegate code.');
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: GossipStatus) {
    if (!supabase || busy) return;
    setBusy(true);
    setError('');
    try {
      const { data, error: updateError } = await supabase.rpc('set_chair_gossip_status', {
        p_gossip_id: id, p_status: status,
      });
      if (updateError || !data) throw updateError ?? new Error('Chair access required');
      setInbox((items) => items.map((item) => item.id === id ? { ...item, status } : item));
    } catch {
      setError('Could not update this message. Check your chair access and try again.');
    } finally {
      setBusy(false);
    }
  }

  const activeMessages = inbox.filter((item) => item.status !== 'dismissed');
  const dismissedMessages = inbox.filter((item) => item.status === 'dismissed');
  const visibleMessages = showDismissed ? dismissedMessages : activeMessages;

  if (profile?.accessType === 'admin') return <Screen eyebrow="KAMUN 2026" title="Gossip box" subtitle="Private committee messages">
    <ThemedText>Gossip submissions are private to each committee’s chairs.</ThemedText>
  </Screen>;

  if (isChair) {
    return <Screen eyebrow="CHAIR INBOX" title="Gossip box" subtitle={profile?.committeeName ?? 'Messages for your committee'}
      onRefresh={() => void refresh()} refreshing={loading}>
      <ThemedText type="small" themeColor="textSecondary">Private submissions for your committee. Check each message before reading it aloud.</ThemedText>
      {error ? <ThemedText themeColor="danger">{error}</ThemedText> : null}
      {loading && !inbox.length ? <ThemedText themeColor="textSecondary">Loading messages…</ThemedText> : null}
      <View style={styles.inboxHeading}>
        <ThemedText type="smallBold">{showDismissed ? 'Dismissed' : 'Messages'} · {visibleMessages.length}</ThemedText>
        {dismissedMessages.length ? <Pressable accessibilityRole="button" onPress={() => setShowDismissed((value) => !value)} style={styles.viewToggle}>
          <ThemedText type="smallBold" themeColor="primary">{showDismissed ? 'Back to messages' : `View dismissed (${dismissedMessages.length})`}</ThemedText>
        </Pressable> : null}
      </View>
      {!loading && !visibleMessages.length ? <ThemedText themeColor="textSecondary">{showDismissed ? 'No dismissed messages.' : 'No messages to review yet.'}</ThemedText> : null}
      {visibleMessages.map((item) => <View key={item.id} style={[styles.inboxItem, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.inboxMeta}>
          <ThemedText type="smallBold" themeColor={item.status === 'new' ? 'primary' : 'textSecondary'}>{item.status === 'new' ? 'New' : item.status === 'read' ? 'Read' : 'Dismissed'}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">{new Date(item.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' })}</ThemedText>
        </View>
        <ThemedText style={styles.messageText}>{item.message}</ThemedText>
        <View style={styles.actions}>
          {item.status === 'new' ? <Pressable accessibilityRole="button" disabled={busy} onPress={() => void setStatus(item.id, 'read')} style={[styles.smallButton, { backgroundColor: theme.primary }]}>
            <ThemedText type="smallBold" themeColor="onPrimary">Mark read</ThemedText>
          </Pressable> : null}
          {item.status === 'dismissed' ? <Pressable accessibilityRole="button" disabled={busy} onPress={() => void setStatus(item.id, 'new')} style={[styles.smallButton, { backgroundColor: theme.primarySoft }]}>
            <ThemedText type="smallBold" themeColor="primary">Restore</ThemedText>
          </Pressable> : <Pressable accessibilityRole="button" disabled={busy} onPress={() => void setStatus(item.id, 'dismissed')} style={[styles.smallButton, { backgroundColor: theme.primarySoft }]}>
            <ThemedText type="smallBold" themeColor="primary">Dismiss</ThemedText>
          </Pressable>}
        </View>
      </View>)}
    </Screen>;
  }

  return <Screen eyebrow="KAMUN 2026" title="Gossip box" subtitle={profile?.committeeName ? `Send some tea to the chairs of the ${profile.committeeName}.` : 'Send some tea to your committee chairs.'}>
    <View style={styles.form}>
        <ThemedText type="small" themeColor="textSecondary">Only your Committee Chairs can view all gossip and you remain anonymous.</ThemedText>
        {!selectedCommittee ? <ThemedText themeColor="danger">Your account has no committee assigned. Please contact the organisers.</ThemedText> : null}
        <ThemedText type="smallBold">YOUR MESSAGE</ThemedText>
        <TextInput accessibilityLabel="Gossip message" multiline maxLength={500} value={message}
          onChangeText={(value) => { setMessage(value); setNotice(''); }}
          placeholder="Write a short, respectful message…" placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
          textAlignVertical="top" />
        <ThemedText type="small" themeColor="textSecondary">{message.length}/500 characters · Please do not send insults, private information, or safety concerns here. For help, use Emergency contacts.</ThemedText>
        {error ? <ThemedText themeColor="danger">{error}</ThemedText> : null}
        {notice ? <ThemedText themeColor="primary">{notice}</ThemedText> : null}
        <Pressable accessibilityRole="button" disabled={busy || !selectedCommittee || message.trim().length < 3}
          onPress={() => void submit()} style={[styles.submit, { backgroundColor: busy || !selectedCommittee || message.trim().length < 3 ? theme.disabledBackground : theme.primary }]}>
          <ThemedText type="smallBold" style={{ color: busy || !selectedCommittee || message.trim().length < 3 ? theme.disabledText : theme.onPrimary }}>{busy ? 'Sending…' : 'Send to chairs'}</ThemedText>
        </Pressable>
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
  input: { borderRadius: 12, borderWidth: 1, fontSize: 16, minHeight: 130, padding: Spacing.three },
  submit: { alignItems: 'center', borderRadius: 12, justifyContent: 'center', minHeight: 52 },
  messageText: { fontSize: 16, lineHeight: 24 },
  inboxHeading: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.two },
  viewToggle: { minHeight: 44, justifyContent: 'center' },
  inboxItem: { borderRadius: 14, borderWidth: 1, gap: Spacing.three, padding: Spacing.three },
  inboxMeta: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.two },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  smallButton: { borderRadius: 10, justifyContent: 'center', minHeight: 44, paddingHorizontal: Spacing.three },
});
