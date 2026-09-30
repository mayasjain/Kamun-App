import { ContentCard } from '@/components/content-card';
import { AttendeeProfileForm } from '@/components/attendee-profile-form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';

export default function MoreScreen() {
  return (
    <Screen eyebrow="KAMUN 2026" title="More" subtitle="Locations, safety and app preferences">
      <ContentCard label="VENUE" title="Karlsruhe Institute of Technology">
        <ThemedText themeColor="textSecondary">Building and room directions will be available here.</ThemedText>
      </ContentCard>
      <ContentCard label="SAFETY" title="Emergency & welfare">
        <ThemedText themeColor="textSecondary">Emergency contacts will be cached for offline access.</ThemedText>
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
