import { PushNotificationSettings } from '@/components/push-notification-settings';
import { AdminUpdateComposer } from '@/components/admin-update-composer';
import { AnnouncementCard } from '@/components/announcement-card';
import { ContentCard } from '@/components/content-card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useConferenceContent } from '@/contexts/conference-content';
import { orderAnnouncements } from '@/lib/announcement-order';

export default function UpdatesScreen() {
  const { content, error, isLoading, source, refresh } = useConferenceContent();
  const announcements = orderAnnouncements(content?.announcements ?? []);

  return (
    <Screen showBack={false} onRefresh={() => void refresh()} refreshing={isLoading} eyebrow="LIVE INFORMATION" title="Updates" subtitle="Official announcements from the Secretariat">
      <PushNotificationSettings />
      <AdminUpdateComposer />
      {announcements.map((announcement) => (
        <AnnouncementCard key={announcement.id} announcement={announcement} adminControls />
      ))}
      {!announcements.length ? (
        <ContentCard label="UPDATES" title={isLoading ? 'Loading announcements…' : 'No announcements yet'}>
          <ThemedText themeColor="textSecondary">New information from the Secretariat will appear here.</ThemedText>
        </ContentCard>
      ) : null}
      {error ? <ThemedText type="small" themeColor="danger">{error}</ThemedText> : null}
      {source === 'cache' ? <ThemedText type="small" themeColor="textSecondary">Showing the last saved offline copy.</ThemedText> : null}
    </Screen>
  );
}
