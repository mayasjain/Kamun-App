import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ContentCard } from '@/components/content-card';
import { AttendeeProfileForm } from '@/components/attendee-profile-form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useConferenceContent } from '@/contexts/conference-content';

export default function MoreScreen() {
  const { content, isLoading } = useConferenceContent();
  const locations = content?.locations ?? [];
  const contacts = content?.emergencyContacts ?? [];

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
      <ContentCard label="SAFETY" title="Emergency & welfare">
        {contacts.length ? contacts.map((contact) => (
          <ThemedText key={contact.id} themeColor="textSecondary">
            {contact.label}{contact.phone ? ` · ${contact.phone}` : ''}{contact.email ? ` · ${contact.email}` : ''}
          </ThemedText>
        )) : <ThemedText themeColor="textSecondary">Awareness contacts will appear here after confirmation.</ThemedText>}
      </ContentCard>
      <ContentCard label="SETTINGS" title="Change access code">
        <ThemedText themeColor="textSecondary">Replace the chair or committee-member access stored on this device.</ThemedText>
        <AttendeeProfileForm submitLabel="Update access" />
      </ContentCard>
      <ContentCard label="SUPPORT" title="vorstand@munika.org">
        <ThemedText themeColor="textSecondary">App version 0.1 foundation</ThemedText>
      </ContentCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  linkRow: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  pressed: { opacity: 0.7 },
});
