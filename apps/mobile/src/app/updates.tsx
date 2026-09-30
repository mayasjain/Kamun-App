import { ContentCard } from '@/components/content-card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { demoAnnouncements } from '@/data/demo';

export default function UpdatesScreen() {
  return (
    <Screen eyebrow="LIVE INFORMATION" title="Updates" subtitle="Official announcements from the Secretariat">
      {demoAnnouncements.map((announcement) => (
        <ContentCard key={announcement.title} label={announcement.time} title={announcement.title}>
          <ThemedText themeColor="textSecondary">{announcement.body}</ThemedText>
        </ContentCard>
      ))}
    </Screen>
  );
}
