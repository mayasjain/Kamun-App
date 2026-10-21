import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { AttendeeOnboarding } from '@/components/attendee-onboarding';
import { AttendeeProfileProvider, useAttendeeProfile } from '@/contexts/attendee-profile';
import { ConferenceContentProvider } from '@/contexts/conference-content';

function AppContent() {
  const { isLoading, profile } = useAttendeeProfile();
  if (isLoading) return null;
  return profile ? <ConferenceContentProvider><AppTabs /></ConferenceContentProvider> : <AttendeeOnboarding />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AttendeeProfileProvider>
        <AppContent />
      </AttendeeProfileProvider>
    </ThemeProvider>
  );
}
