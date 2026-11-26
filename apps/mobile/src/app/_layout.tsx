import { DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import AppTabs from '@/components/app-tabs';
import { ConferenceContentProvider } from '@/contexts/conference-content';

export default function TabLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <StatusBar style="dark" />
      <ConferenceContentProvider><AppTabs /></ConferenceContentProvider>
    </ThemeProvider>
  );
}
