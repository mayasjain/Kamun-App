import { useRef, useState } from 'react';
import { View } from 'react-native';
import { RemoveConfirmation } from './remove-confirmation';
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
    <RemoveConfirmation confirming={confirming} prompt={`Remove “${title}” from the app?`} label={`Remove ${title}`} busy={busy}
      onStart={() => setConfirming(true)} onConfirm={() => void remove()} onCancel={() => { setConfirming(false); setError(''); }} />
    {error ? <ThemedText accessibilityRole="alert" type="small" themeColor="danger">{error}</ThemedText> : null}
  </View>;
}
