import { DefaultTheme, ThemeProvider } from 'expo-router';
import { NotificationWorkerUpdater } from '@/components/notification-worker-updater';
import { StatusBar } from 'expo-status-bar';

import AppTabs from '@/components/app-tabs';
import { StartupLoading } from '@/components/startup-loading';
import { AttendeeOnboarding } from '@/components/attendee-onboarding';
import { OrganizerMessages } from '@/components/organizer-messages';
import { AttendeeProfileProvider, useAttendeeProfile } from '@/contexts/attendee-profile';
import { ConferenceContentProvider } from '@/contexts/conference-content';
import { OrganizerProvider, useOrganizer } from '@/contexts/organizer';

function AppContent() {
  const { isLoading, profile } = useAttendeeProfile();
  const organizer = useOrganizer();
  if (isLoading || organizer.isLoading) return <StartupLoading />;
  if (organizer.mode === 'organizer') return <OrganizerMessages />;
  return profile ? <ConferenceContentProvider><AppTabs /></ConferenceContentProvider> : <AttendeeOnboarding />;
}

export default function TabLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <StatusBar style="dark" />
      <NotificationWorkerUpdater />
      <AttendeeProfileProvider>
        <OrganizerProvider><AppContent /></OrganizerProvider>
      </AttendeeProfileProvider>
    </ThemeProvider>
  );
}
