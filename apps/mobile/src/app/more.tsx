import { useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { ContentCard } from '@/components/content-card';
import { AttendeeProfileForm } from '@/components/attendee-profile-form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useAttendeeProfile } from '@/contexts/attendee-profile';
import { signOutOfBothApps } from '@/lib/ecg-handoff';
import { supabase } from '@/lib/supabase';

export default function MoreScreen() {
  const { clearProfile, profile } = useAttendeeProfile();
  const [signingOut, setSigningOut] = useState(false);
  const [changingAccess, setChangingAccess] = useState(false);
  const [signOutError, setSignOutError] = useState('');

  async function signOut() {
    if (signingOut || changingAccess) return;
    setSigningOut(true);
    setSignOutError('');
    try {
      if (profile?.identitySource === 'ecg') await signOutOfBothApps();
      else if (supabase) {
        const { error } = await supabase.auth.signOut({ scope: 'local' });
        if (error) throw error;
      }
      clearProfile();
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : 'Could not sign out. Check your connection and try again.');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <Screen eyebrow="KAMUN 2026" title="More" subtitle="Your access and app setup">
      {Platform.OS === 'web' ? (
        <ContentCard label="HOME SCREEN" title="Keep KAMUN on your phone">
          <ThemedText themeColor="textSecondary">
            On iPhone, open this site in Safari, tap Share, then Add to Home Screen. On Android, open it in Chrome, tap the browser menu, then Install app or Add to Home screen.
          </ThemedText>
        </ContentCard>
      ) : null}
      <ContentCard label="SETTINGS" title="Change access code">
        <ThemedText themeColor="textSecondary">Signed in as {profile?.committeeName ?? 'KAMUN'}{profile?.seatLabel ? ` · ${profile.seatLabel}` : profile?.accessType === 'chair' ? ' · Chair' : ''}.</ThemedText>
        <ThemedText themeColor="textSecondary">Enter a different code to change access on this device.</ThemedText>
        <AttendeeProfileForm submitLabel="Update access" disabled={signingOut} onSubmittingChange={setChangingAccess} />
        <Pressable accessibilityRole="button" disabled={signingOut || changingAccess} onPress={() => void signOut()} style={styles.signOutButton}>
          <ThemedText type="smallBold" themeColor="primary">{signingOut ? 'Signing out…' : profile?.identitySource === 'ecg' ? 'Sign out of KAMUN and ECE' : 'Sign out on this device'}</ThemedText>
        </Pressable>
        <ThemedText type="small" themeColor="textSecondary">{profile?.identitySource === 'ecg' ? 'This ends KAMUN and the ECE sessions opened from this login. Internet is required to sign out of both.' : 'You will need an access code to sign in again.'}</ThemedText>
        {signOutError ? <ThemedText type="small" themeColor="danger">{signOutError}</ThemedText> : null}
      </ContentCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  signOutButton: { alignItems: 'center', justifyContent: 'center', minHeight: 48, marginTop: 12 },
});
