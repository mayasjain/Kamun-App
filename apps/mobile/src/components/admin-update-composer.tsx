import { useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { ContentCard } from './content-card';
import { ThemedText } from './themed-text';
import { useAttendeeProfile } from '@/contexts/attendee-profile';
import { useConferenceContent } from '@/contexts/conference-content';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

export function AdminUpdateComposer() {
  const { profile } = useAttendeeProfile();
  const { refresh } = useConferenceContent();
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<'all' | 'chair' | 'member'>('all');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const locked = useRef(false);
  if (profile?.accessType !== 'admin') return null;
  const inputStyle = { borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 48, color: theme.text, borderColor: theme.border, fontSize: 16 };
  async function publish() {
    if (!supabase || !profile || locked.current || !title.trim() || !body.trim()) return;
    locked.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const { error } = await supabase.from('announcements').insert({
        conference_id: profile.conferenceId, committee_id: null, title: title.trim(), body: body.trim(),
        audience, priority: 'normal', published: true, published_at: new Date().toISOString(),
      });
      if (error) throw error;
      setTitle(''); setBody(''); setAudience('all'); setNotice('Update published.');
      await refresh();
    } catch { setError('Could not publish the update. Check your connection and admin access, then try again.'); }
    finally { locked.current = false; setBusy(false); }
  }
  return <View style={{ gap: 12 }}>
    <ContentCard label="NEW UPDATE" title="Write a message">
      <View style={{ gap: 12 }}>
        <TextInput accessibilityLabel="Update title" placeholder="Title" placeholderTextColor={theme.textSecondary} value={title} onChangeText={setTitle} maxLength={160} editable={!busy} style={inputStyle} />
        <TextInput accessibilityLabel="Update message" placeholder="What should attendees know?" placeholderTextColor={theme.textSecondary} value={body} onChangeText={setBody} maxLength={10000} multiline textAlignVertical="top" editable={!busy} style={[inputStyle, { minHeight: 130 }]} />
        <ThemedText type="smallBold">Send to</ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{(['all', 'chair', 'member'] as const).map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: audience === value, disabled: busy }} disabled={busy} onPress={() => setAudience(value)} style={{ minHeight: 44, padding: 12, borderRadius: 12, backgroundColor: audience === value ? theme.primary : theme.primarySoft }}><ThemedText type="smallBold" style={{ color: audience === value ? theme.onPrimary : theme.primary }}>{value === 'all' ? 'Everyone' : value === 'chair' ? 'Chairs' : 'Delegates'}</ThemedText></Pressable>)}</View>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy || !title.trim() || !body.trim(), busy }} disabled={busy || !title.trim() || !body.trim()} onPress={() => void publish()} style={{ minHeight: 48, justifyContent: 'center' }}><ThemedText type="smallBold" themeColor="primary">{busy ? 'Publishing…' : 'Publish update'}</ThemedText></Pressable>
      </View>
    </ContentCard>
    {error ? <ThemedText accessibilityRole="alert" themeColor="danger">{error}</ThemedText> : null}
    {notice ? <ThemedText accessibilityLiveRegion="polite" themeColor="primary">{notice}</ThemedText> : null}
  </View>;
}
