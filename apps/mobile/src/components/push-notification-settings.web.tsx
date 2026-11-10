import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { ThemedText } from './themed-text';
import { useAttendeeProfile } from '@/contexts/attendee-profile';
import { useTheme } from '@/hooks/use-theme';
import { disablePush, enablePush, pushEnabled, pushSupport } from '@/lib/web-push-client';

export function PushNotificationSettings() {
  const { profile } = useAttendeeProfile();
  const theme = useTheme();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  const support = pushSupport();
  useEffect(() => {
    let active = true;
    if (support === 'supported' && profile) {
      void pushEnabled().then(value => { if (active) setEnabled(value); })
        .catch(() => { if (active) setMessage('Could not check notifications. Try again when connected.'); })
        .finally(() => { if (active) setBusy(false); });
    }
    return () => { active = false; };
  }, [profile, support]);
  async function toggle() {
    if (busy) return;
    setBusy(true); setMessage('');
    try {
      if (enabled) await disablePush(); else await enablePush();
      setEnabled(!enabled);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not update notifications.'); }
    finally { setBusy(false); }
  }
  if (!profile || profile.identitySource !== 'ecg') return null;
  return <View style={{ gap: 8, paddingVertical: 8 }}>
    <ThemedText type="small" themeColor="textSecondary">{support === 'install'
      ? 'On iPhone or iPad, add KAMUN to your Home Screen and open it there to enable alerts (iOS 16.4 or later).'
      : support === 'unsupported' ? 'Phone alerts are unavailable in this browser. Updates refresh automatically while KAMUN is open.'
        : enabled ? 'Update notifications are enabled on this device.' : 'Get phone alerts when the Secretariat publishes an update.'}</ThemedText>
    {support === 'supported' && <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={() => void toggle()} style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}>
      <ThemedText type="smallBold" style={{ color: theme.primary }}>{busy ? 'Checking notifications…' : enabled ? 'Turn off notifications' : 'Enable notifications'}</ThemedText>
    </Pressable>}
    {message ? <ThemedText accessibilityRole="alert" type="small" themeColor="danger">{message}</ThemedText> : null}
  </View>;
}
