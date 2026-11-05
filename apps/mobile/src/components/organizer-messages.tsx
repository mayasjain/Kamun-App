import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ContentCard } from '@/components/content-card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useOrganizer } from '@/contexts/organizer';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

type Audience = 'all' | 'chair' | 'member';
type Priority = 'normal' | 'important' | 'urgent';
type Message = { id: string; title: string; body: string; audience: Audience; published_at: string };
const audiences: { value: Audience; label: string }[] = [
  { value: 'all', label: 'Everyone' }, { value: 'chair', label: 'Chairs' }, { value: 'member', label: 'Delegates' },
];
const priorities: { value: Priority; label: string }[] = [
  { value: 'normal', label: 'Normal' }, { value: 'important', label: 'Important' }, { value: 'urgent', label: 'Urgent' },
];

export function OrganizerMessages() {
  const theme = useTheme();
  const organizer = useOrganizer();
  const { conferenceId } = organizer;
  const [messages, setMessages] = useState<Message[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<Audience>('all');
  const [priority, setPriority] = useState<Priority>('normal');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    if (!supabase || !conferenceId) { setError('Organiser access is unavailable. Sign in again.'); setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error: messagesError } = await supabase.from('announcements')
        .select('id,title,body,audience,published_at').eq('conference_id', conferenceId)
        .eq('published', true).order('published_at', { ascending: false });
      if (messagesError) throw messagesError;
      setMessages((data ?? []) as Message[]);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load messages.');
    } finally {
      setLoading(false);
    }
  }, [conferenceId]);

  useEffect(() => {
    const task = Promise.resolve().then(() => refresh());
    void task;
  }, [refresh]);

  async function publish() {
    if (!supabase || !conferenceId || !title.trim() || !body.trim() || busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const { error: publishError } = await supabase.from('announcements').insert({
        conference_id: conferenceId, committee_id: null, title: title.trim(), body: body.trim(),
        audience, priority, published: true, published_at: new Date().toISOString(),
      });
      if (publishError) throw publishError;
      setTitle('');
      setBody('');
      setPriority('normal');
      setAudience('all');
      setNotice('Message published. It is now visible to the selected group in Updates.');
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not publish the message.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen eyebrow="KAMUN ORGANISER" title="Send an update" subtitle="Publish a message for chairs, delegates, or everyone."
      onRefresh={() => void refresh()} refreshing={loading}>
      <ContentCard label="NEW MESSAGE" title="Announcement">
        <View style={styles.form}>
          <ThemedText type="smallBold">TITLE</ThemedText>
          <TextInput accessibilityLabel="Message title" maxLength={160} onChangeText={setTitle} placeholder="Short headline"
            placeholderTextColor={theme.textSecondary} style={[styles.input, { backgroundColor: theme.backgroundElement, borderColor: theme.border, color: theme.text }]} value={title} />
          <ThemedText type="smallBold">MESSAGE</ThemedText>
          <TextInput accessibilityLabel="Message body" maxLength={10000} multiline onChangeText={setBody} placeholder="What should attendees know?"
            placeholderTextColor={theme.textSecondary} style={[styles.input, styles.bodyInput, { backgroundColor: theme.backgroundElement, borderColor: theme.border, color: theme.text }]} textAlignVertical="top" value={body} />
          <ThemedText type="smallBold">SEND TO</ThemedText>
          <View style={styles.choiceRow}>{audiences.map((option) => (
            <Pressable key={option.value} accessibilityRole="button" accessibilityState={{ selected: audience === option.value }}
              onPress={() => setAudience(option.value)} style={[styles.choice, { backgroundColor: audience === option.value ? theme.primary : theme.primarySoft }]}>
              <ThemedText type="smallBold" style={{ color: audience === option.value ? theme.onPrimary : theme.primary }}>{option.label}</ThemedText>
            </Pressable>
          ))}</View>
          <ThemedText type="smallBold">PRIORITY</ThemedText>
          <View style={styles.choiceRow}>{priorities.map((option) => (
            <Pressable key={option.value} accessibilityRole="button" accessibilityState={{ selected: priority === option.value }}
              onPress={() => setPriority(option.value)} style={[styles.choice, { backgroundColor: priority === option.value ? theme.primary : theme.primarySoft }]}>
              <ThemedText type="smallBold" style={{ color: priority === option.value ? theme.onPrimary : theme.primary }}>{option.label}</ThemedText>
            </Pressable>
          ))}</View>
          {error ? <ThemedText type="small" themeColor="danger">{error}</ThemedText> : null}
          {notice ? <ThemedText type="small" themeColor="primary">{notice}</ThemedText> : null}
          <Pressable accessibilityRole="button" disabled={busy || !conferenceId || !title.trim() || !body.trim()}
            onPress={() => void publish()} style={[styles.primaryButton, { backgroundColor: busy || !conferenceId || !title.trim() || !body.trim() ? theme.disabledBackground : theme.primary }]}>
            <ThemedText type="smallBold" style={{ color: busy || !conferenceId || !title.trim() || !body.trim() ? theme.disabledText : theme.onPrimary }}>{busy ? 'Publishing…' : 'Publish message'}</ThemedText>
          </Pressable>
          <ThemedText type="small" themeColor="textSecondary">Messages appear in Updates. Phone push alerts are not active yet.</ThemedText>
        </View>
      </ContentCard>
      <ThemedText type="subtitle">Published messages</ThemedText>
      {messages.map((message) => (
        <ContentCard key={message.id} label={`${audiences.find((item) => item.value === message.audience)?.label ?? 'Everyone'} · ${new Date(message.published_at).toLocaleString()}`} title={message.title}>
          <ThemedText themeColor="textSecondary">{message.body}</ThemedText>
        </ContentCard>
      ))}
      {!loading && !messages.length ? <ThemedText themeColor="textSecondary">No messages published yet.</ThemedText> : null}
      <Pressable accessibilityRole="button" onPress={() => void organizer.signOut()} style={styles.signOut}>
        <ThemedText themeColor="primary">Sign out of organiser mode</ThemedText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.two },
  input: { borderRadius: 12, borderWidth: 1, fontSize: 16, minHeight: 52, paddingHorizontal: 14, paddingVertical: 12 },
  bodyInput: { minHeight: 130 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginBottom: Spacing.two },
  choice: { borderRadius: 999, minHeight: 44, justifyContent: 'center', paddingHorizontal: 16 },
  primaryButton: { alignItems: 'center', borderRadius: 12, justifyContent: 'center', minHeight: 54, marginTop: Spacing.two },
  signOut: { alignItems: 'center', justifyContent: 'center', minHeight: 48, marginBottom: Spacing.four },
});
