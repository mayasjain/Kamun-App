import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AttendeeProfileForm } from '@/components/attendee-profile-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';
import { useOrganizer } from '@/contexts/organizer';

export function AttendeeOnboarding() {
  const organizer = useOrganizer();
  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Image
              accessibilityLabel="KAMUN Black Forest Summit logo"
              resizeMode="contain"
              source={require('../../assets/branding/kamun-logo-v2.png')}
              style={styles.logo}
            />
            <ThemedText type="smallBold" style={styles.kicker}>13–15 NOVEMBER 2026 · KARLSRUHE</ThemedText>
            <ThemedText type="subtitle" style={styles.heroTitle}>From the Black Forest to the global stage.</ThemedText>
          </View>

          <View style={styles.panel}>
            <View style={styles.copy}>
              <ThemedText type="smallBold" style={styles.eyebrow}>WELCOME TO KAMUN</ThemedText>
              <ThemedText type="title">Enter your access code</ThemedText>
              <ThemedText themeColor="textSecondary">Enter your chair or delegate code from the conference organiser.</ThemedText>
            </View>
            <AttendeeProfileForm />
            <ThemedText type="small" themeColor="textSecondary" style={styles.privacy}>
              No email or password is required. Your access stays on this device.
            </ThemedText>
          </View>
          <Pressable accessibilityRole="button" onPress={organizer.enter} style={styles.organizerLink}>
            <ThemedText type="smallBold" themeColor="primary">Organiser sign in →</ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { alignSelf: 'center', maxWidth: MaxContentWidth, width: '100%' },
  hero: { alignItems: 'center', backgroundColor: Brand.black, gap: Spacing.two, paddingBottom: Spacing.four, paddingHorizontal: Spacing.four, paddingTop: Spacing.three },
  logo: { height: 220, width: 220 },
  kicker: { color: Brand.gold, fontSize: 12, letterSpacing: 1.2, textAlign: 'center' },
  heroTitle: { color: Brand.white, fontSize: 21, lineHeight: 28, maxWidth: 360, textAlign: 'center' },
  panel: { gap: Spacing.four, padding: Spacing.four, paddingBottom: Spacing.five },
  copy: { gap: Spacing.two },
  eyebrow: { color: Brand.goldDark, fontSize: 12, letterSpacing: 1.2 },
  privacy: { textAlign: 'center' },
  organizerLink: { alignItems: 'center', minHeight: 48, justifyContent: 'center', marginBottom: Spacing.four },
});
