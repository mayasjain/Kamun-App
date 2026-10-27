import { Link } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ContentCard } from '@/components/content-card';
import { AttendeeProfileForm } from '@/components/attendee-profile-form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useAttendeeProfile } from '@/contexts/attendee-profile';
import { supabase } from '@/lib/supabase';

export default function MoreScreen() {
  const { clearProfile } = useAttendeeProfile();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError('');
    try {
      if (supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
      clearProfile();
    } catch {
      setSignOutError('Could not sign out. Check your connection and try again.');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <Screen eyebrow="KAMUN 2026" title="More" subtitle="Safety and app preferences">
      <Link href="/emergency" asChild>
        <Pressable accessibilityRole="link" style={({ pressed }) => pressed && styles.pressed}>
          <ContentCard label="SAFETY" title="Emergency contacts">
            <View style={styles.linkRow}>
              <ThemedText themeColor="textSecondary">Secretary General, Deputy Secretary General and USG Safety and Security</ThemedText>
              <ThemedText themeColor="primary">→</ThemedText>
            </View>
          </ContentCard>
        </Pressable>
      </Link>
      {Platform.OS === 'web' ? (
        <ContentCard label="HOME SCREEN" title="Keep KAMUN on your phone">
          <ThemedText themeColor="textSecondary">
            On iPhone, open this site in Safari, tap Share, then Add to Home Screen. On Android, open it in Chrome, tap the browser menu, then Install app or Add to Home screen.
          </ThemedText>
        </ContentCard>
      ) : null}
      <ContentCard label="SETTINGS" title="Change access code">
        <ThemedText themeColor="textSecondary">Replace the chair or delegate access stored on this device.</ThemedText>
        <AttendeeProfileForm submitLabel="Update access" />
        <Pressable accessibilityRole="button" disabled={signingOut} onPress={() => void signOut()} style={styles.signOutButton}>
          <ThemedText type="smallBold" themeColor="primary">{signingOut ? 'Signing out…' : 'Sign out on this device'}</ThemedText>
        </Pressable>
        <ThemedText type="small" themeColor="textSecondary">You will need an access code to sign in again.</ThemedText>
        {signOutError ? <ThemedText type="small" themeColor="danger">{signOutError}</ThemedText> : null}
      </ContentCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  linkRow: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  pressed: { opacity: 0.7 },
  signOutButton: { alignItems: 'center', justifyContent: 'center', minHeight: 48, marginTop: 12 },
});
