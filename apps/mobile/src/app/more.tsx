import { Link } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ContentCard } from '@/components/content-card';
import { AttendeeProfileForm } from '@/components/attendee-profile-form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useConferenceContent } from '@/contexts/conference-content';
import { useOrganizer } from '@/contexts/organizer';

export default function MoreScreen() {
  const { content, isLoading } = useConferenceContent();
  const organizer = useOrganizer();
  const locations = content?.locations ?? [];

  return (
    <Screen eyebrow="KAMUN 2026" title="More" subtitle="Locations, safety and app preferences">
      <Link href="/committees" asChild>
        <Pressable accessibilityRole="link" style={({ pressed }) => pressed && styles.pressed}>
          <ContentCard label="ACADEMIC PROGRAMME" title="Committees">
            <View style={styles.linkRow}>
              <ThemedText themeColor="textSecondary">Topics, levels and committee chairs</ThemedText>
              <ThemedText themeColor="primary">→</ThemedText>
            </View>
          </ContentCard>
        </Pressable>
      </Link>
      {locations.map((location) => (
        <ContentCard key={location.id} label={location.category.toUpperCase()} title={location.name}>
          <ThemedText themeColor="textSecondary">{location.address ?? location.description ?? 'Details coming soon'}</ThemedText>
        </ContentCard>
      ))}
      {!locations.length ? (
        <ContentCard label="VENUES" title={isLoading ? 'Loading locations…' : 'Locations coming soon'}>
          <ThemedText themeColor="textSecondary">Approved venue information will appear here.</ThemedText>
        </ContentCard>
      ) : null}
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
      </ContentCard>
      <Pressable accessibilityRole="button" onPress={organizer.enter} style={styles.organizerLink}>
        <ThemedText type="smallBold" themeColor="primary">Organiser sign in →</ThemedText>
      </Pressable>
      <ContentCard label="SUPPORT" title="vorstand@munika.org">
        <ThemedText themeColor="textSecondary">App version 0.1 foundation</ThemedText>
      </ContentCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  linkRow: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  pressed: { opacity: 0.7 },
  organizerLink: { alignItems: 'center', minHeight: 48, justifyContent: 'center' },
});
