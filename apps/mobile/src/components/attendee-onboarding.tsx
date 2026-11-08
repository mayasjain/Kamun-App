import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AttendeeProfileForm } from '@/components/attendee-profile-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAttendeeProfile } from '@/contexts/attendee-profile';

export function AttendeeOnboarding() {
  const { restoreError } = useAttendeeProfile();
  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Image accessibilityLabel="KAMUN crest" resizeMode="contain" source={require('../../assets/branding/kamun-logo-v2.png')} style={styles.headerLogo} />
            <View style={styles.headerCopy}>
              <ThemedText style={styles.headerTitle}>KAMUN 2026</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Black Forest Summit · Karlsruhe</ThemedText>
            </View>
          </View>

          <View accessible accessibilityLabel="KAMUN 2026 banner showing Karlsruhe Palace and the Black Forest" style={styles.banner}>
            <Image source={require('../../assets/branding/kamun-banner.png')} resizeMode="cover" style={styles.bannerArt} accessible={false} />
            <Image source={require('../../assets/branding/kamun-logo-v2.png')} resizeMode="contain" style={styles.bannerLogo} accessible={false} />
          </View>

          <View style={styles.panel}>
            <View style={styles.copy}>
              <ThemedText type="smallBold" style={styles.eyebrow} themeColor="primary">13–15 NOVEMBER 2026 · KARLSRUHE</ThemedText>
              <ThemedText type="title">Enter your code</ThemedText>
              <ThemedText themeColor="textSecondary">Use your personal delegate, chair, or administrator code. Your access will be recognised automatically.</ThemedText>
            </View>
            {restoreError ? <ThemedText themeColor="danger">{restoreError}</ThemedText> : null}
            <AttendeeProfileForm />
            <ThemedText type="small" themeColor="textSecondary" style={styles.privacy}>
              One code for KAMUN. You stay signed in on this device until you sign out or your access expires.
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { alignSelf: 'center', maxWidth: MaxContentWidth, paddingBottom: Spacing.five, paddingHorizontal: Spacing.four, paddingTop: Spacing.two, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', gap: 10, marginBottom: Spacing.three, minHeight: 54 },
  headerLogo: { height: 52, width: 52 },
  headerCopy: { flex: 1, gap: 1 },
  headerTitle: { fontSize: 22, fontWeight: '500', lineHeight: 27 },
  banner: { backgroundColor: Brand.black, borderRadius: 20, height: 180, justifyContent: 'center', overflow: 'hidden' },
  bannerArt: { ...StyleSheet.absoluteFill, height: '100%', width: '100%' },
  bannerLogo: { height: 132, marginLeft: 12, width: 132 },
  panel: { gap: Spacing.four, paddingTop: Spacing.four },
  copy: { gap: Spacing.two },
  eyebrow: { fontSize: 12, letterSpacing: 1.2 },
  privacy: { textAlign: 'center' },
});
