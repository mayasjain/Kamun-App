import { useState } from 'react';
import { Link } from 'expo-router';
import { Alert, Image, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { InstagramLinks } from '@/components/instagram-links';
import { MoreIcon } from '@/components/more-icon';
import { Colors, Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AttendeeProfileForm } from '@/components/attendee-profile-form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useAttendeeProfile } from '@/contexts/attendee-profile';
import { signOutOfBothApps } from '@/lib/ecg-session';
import { supabase } from '@/lib/supabase';

export default function MoreScreen() {
  const theme = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 400 || fontScale > 1.3;
  const [showInstall, setShowInstall] = useState(false);
  const [showAccess, setShowAccess] = useState(false);
  const { clearProfile, profile } = useAttendeeProfile();
  const [signingOut, setSigningOut] = useState(false);
  const [changingAccess, setChangingAccess] = useState(false);
  const [signOutError, setSignOutError] = useState('');

  function confirmSignOut() {
    if (signingOut || changingAccess) return;
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) void signOut();
      return;
    }
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);
  }

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

  const card = { backgroundColor: theme.backgroundElement };
  const divider = { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border };
  return (
    <Screen compactHeader eyebrow="" title="More" subtitle="Manage your KAMUN experience">
      {Platform.OS === 'web' ? <View style={[styles.card, card]}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: showInstall }} onPress={() => setShowInstall(v => !v)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <View style={[styles.iconBox, { backgroundColor: theme.primarySoft }]}><MoreIcon name="install" color={theme.primary} /></View>
          <View style={styles.copy}><ThemedText style={styles.rowTitle}>Install KAMUN</ThemedText><ThemedText type="small" themeColor="textSecondary">Keep the conference one tap away</ThemedText></View>
          <View style={[styles.howTo, { borderColor: theme.border }]}>{!compact && <ThemedText type="small" themeColor="textSecondary">How to</ThemedText>}<MoreIcon name={showInstall ? 'chevronDown' : 'chevron'} color={theme.textSecondary} size={18} /></View>
        </Pressable>
        {showInstall ? <View style={[styles.expanded, divider]}>
          <ThemedText type="small" themeColor="textSecondary">On iPhone, open this site in Safari, tap Share, then Add to Home Screen.</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">On Android, open it in Chrome, tap the browser menu, then Install app or Add to Home screen.</ThemedText>
        </View> : null}
      </View> : null}
      <ThemedText accessibilityRole="header" type="smallBold" themeColor="primary" style={styles.sectionLabel}>STAY CONNECTED</ThemedText>
      <View style={[styles.card, styles.socialCard, card]}>
        <View style={styles.socialHeading}>
          <View style={styles.socialLogo}><Image source={require('../../assets/branding/instagram.png')} style={styles.instagram} resizeMode="contain" accessible={false} /></View>
          <View style={styles.copy}><ThemedText style={styles.rowTitle}>Follow KAMUN</ThemedText><ThemedText type="small" themeColor="textSecondary">News, memes & conference moments</ThemedText></View>
        </View>
        <InstagramLinks tiles />
      </View>
      <View style={[styles.card, card]}>
        <Link href="https://tally.so/r/Vpjy0M" target="_blank" rel="noopener noreferrer" asChild>
          <Pressable accessibilityRole="link" accessibilityLabel="We’d love to hear from you! Feedback survey, opens in your browser" style={styles.feedbackLink}>
            {({ pressed }) => <View style={[styles.row, styles.feedbackRow, pressed && styles.pressed]}>
              <View style={[styles.iconBox, { backgroundColor: theme.primarySoft }]}><MoreIcon name="feedback" color={theme.primary} /></View>
              <View style={styles.copy}><ThemedText style={styles.rowTitle}>We’d love to hear from you!</ThemedText><ThemedText type="small" themeColor="textSecondary">Found a bug? Have an idea? Share your feedback.</ThemedText></View>
              <MoreIcon name="chevron" color={theme.textSecondary} size={18} />
            </View>}
          </Pressable>
        </Link>
      </View>
      <ThemedText accessibilityRole="header" type="smallBold" themeColor="primary" style={styles.sectionLabel}>ACCOUNT & ACCESS</ThemedText>
      <View style={[styles.card, card]}>
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: theme.primarySoft }]}><MoreIcon name="identity" color={theme.primary} /></View>
          <View style={styles.copy}>
            <ThemedText style={styles.rowTitle}>Your conference identity</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">{profile?.committeeName ?? 'KAMUN 2026'}</ThemedText>
            <View style={[styles.badge, { backgroundColor: theme.primarySoft }]}><ThemedText type="small">{profile?.seatLabel || (profile?.accessType === 'admin' ? 'Administrator' : profile?.accessType === 'chair' ? 'Chair' : 'Delegate')}</ThemedText></View>
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: showAccess, disabled: signingOut || changingAccess }} disabled={signingOut || changingAccess} onPress={() => setShowAccess(v => !v)} style={({ pressed }) => [styles.row, divider, pressed && styles.pressed]}>
          <MoreIcon name="key" color={theme.primary} />
          <View style={styles.copy}><ThemedText style={styles.rowTitle}>Change access code</ThemedText><ThemedText type="small" themeColor="textSecondary">Switch your assigned access on this device</ThemedText></View>
          <MoreIcon name={showAccess ? 'chevronDown' : 'chevron'} color={theme.textSecondary} size={18} />
        </Pressable>
        {showAccess ? <View style={styles.expanded}><AttendeeProfileForm submitLabel="Update access" disabled={signingOut} onSubmittingChange={setChangingAccess} /></View> : null}
        <Pressable accessibilityRole="button" disabled={signingOut || changingAccess} accessibilityState={{ disabled: signingOut || changingAccess, busy: signingOut }} onPress={confirmSignOut} style={({ pressed }) => [styles.row, divider, (pressed || signingOut || changingAccess) && styles.pressed]}>
          <MoreIcon name="logout" color={theme.danger} />
          <ThemedText style={[styles.rowTitle, styles.copy, { color: theme.danger }]}>{signingOut ? 'Signing out…' : 'Sign out'}</ThemedText>
        </Pressable>
        {signOutError ? <ThemedText type="small" themeColor="danger" accessibilityRole="alert" style={styles.error}>{signOutError}</ThemedText> : null}
      </View>
      <View style={styles.footerLinks}>
        <Link href="/privacy" asChild>
          <Pressable accessibilityRole="link" style={({ pressed }) => [styles.privacyLink, pressed && styles.pressed]}>
            <ThemedText style={styles.privacyText}>Privacy Policy</ThemedText>
          </Pressable>
        </Link>
        <View style={styles.copyrightPanel}>
          <ThemedText style={styles.footer}>© KAMUN 2026 · MUNIKA</ThemedText>
          <ThemedText style={styles.footerCopy}>Conference content and materials are provided for KAMUN participants. Please obtain permission from the organisers before reproducing or distributing them. Third-party materials remain the property of their respective owners.</ThemedText>
          <View style={styles.contactBlock}>
            <ThemedText style={styles.footerCopy}>Interested in using this platform for your conference?</ThemedText>
            <Link href="mailto:vorstand@munika.org" asChild>
              <Pressable accessibilityRole="link" accessibilityLabel="Email MUNIKA at vorstand@munika.org" style={({ pressed }) => [styles.emailLink, pressed && styles.pressed]}>
                <ThemedText style={styles.footerCopy}>vorstand@munika.org</ThemedText>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, paddingHorizontal: 16, overflow: 'hidden' },
  feedbackLink: { width: '100%' },
  feedbackRow: { width: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 18, minHeight: 64 },
  iconBox: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0, gap: 5 },
  rowTitle: { fontSize: 17, lineHeight: 23, fontWeight: '400' },
  howTo: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, minHeight: 44 },
  expanded: { gap: 12, paddingVertical: 16 },
  badge: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 3, alignSelf: 'flex-start' },
  sectionLabel: { marginTop: 4, fontSize: 12, lineHeight: 18, letterSpacing: 0.4 },
  pressed: { opacity: 0.6 },
  error: { paddingBottom: 16 },
  socialCard: { paddingVertical: 16, gap: 14 },
  socialHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  socialLogo: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  instagram: { width: 38, height: 38 },
  footerLinks: { alignItems: 'center', gap: 8, paddingTop: 8, paddingBottom: 16 },
  copyrightPanel: { width: '100%', maxWidth: 560, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8, gap: 10 },
  footerCopy: { color: Colors.light.primary, fontFamily: Fonts.serif, fontStyle: 'italic', textAlign: 'center', fontSize: 12, lineHeight: 18 },
  contactBlock: { alignItems: 'center', width: '100%' },
  emailLink: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12 },
  privacyLink: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 24 },
  privacyText: { color: Colors.light.primary, fontFamily: Fonts.serif, fontStyle: 'italic', fontSize: 17, lineHeight: 25 },
  footer: { color: Colors.light.primary, textAlign: 'center', fontSize: 11, lineHeight: 16, letterSpacing: 0.8, fontWeight: '700' },
});
