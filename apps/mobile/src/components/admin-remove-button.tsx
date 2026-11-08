import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { ThemedText } from './themed-text';
import { useAttendeeProfile } from '@/contexts/attendee-profile';
import { useConferenceContent } from '@/contexts/conference-content';

export function AdminRemoveButton({ id, title }: {
  id: string; title: string;
}) {
  const { profile } = useAttendeeProfile();
  const { removeAnnouncement } = useConferenceContent();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const locked = useRef(false);
  if (profile?.accessType !== 'admin') return null;
  async function remove() {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError('');
    try { await removeAnnouncement(id); setConfirming(false); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not remove this item.'); }
    finally { locked.current = false; setBusy(false); }
  }
  return <View>
    {confirming ? <>
      <ThemedText type="small">Remove “{title}” from the app?</ThemedText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        <Pressable accessibilityRole="button" disabled={busy} accessibilityState={{ disabled: busy, busy }} onPress={() => void remove()} style={{ minHeight: 44, justifyContent: 'center' }}><ThemedText type="smallBold" themeColor="danger">{busy ? 'Removing…' : 'Yes, remove'}</ThemedText></Pressable>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setConfirming(false); setError(''); }} style={{ minHeight: 44, justifyContent: 'center' }}><ThemedText type="smallBold">Cancel</ThemedText></Pressable>
      </View>
    </> : <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${title}`} onPress={() => setConfirming(true)} style={{ minHeight: 44, justifyContent: 'center' }}><ThemedText type="smallBold" themeColor="danger">Remove</ThemedText></Pressable>}
    {error ? <ThemedText accessibilityRole="alert" type="small" themeColor="danger">{error}</ThemedText> : null}
  </View>;
}
