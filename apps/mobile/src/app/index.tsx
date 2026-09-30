import { StyleSheet, View } from 'react-native';

import { ContentCard } from '@/components/content-card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { demoConference, demoSchedule } from '@/data/demo';
import { useAttendeeProfile } from '@/contexts/attendee-profile';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const theme = useTheme();
  const { profile } = useAttendeeProfile();
  const nextEvent = demoSchedule[0];

  return (
    <Screen eyebrow="THE BLACK FOREST SUMMIT" title="Good afternoon" subtitle="Your KAMUN companion">
      <View style={[styles.committee, { backgroundColor: theme.primarySoft }]}>
        <ThemedText type="smallBold" style={{ color: theme.primary }}>
          YOUR ACCESS
        </ThemedText>
        <ThemedText type="subtitle">{profile?.accessLabel}</ThemedText>
        <ThemedText themeColor="textSecondary">Committee-specific assignment will be added later.</ThemedText>
      </View>

      <ContentCard label="NEXT SESSION" title={nextEvent.title} accent>
        <ThemedText style={styles.onAccent}>{nextEvent.time}</ThemedText>
        <ThemedText style={styles.onAccentSecondary}>{nextEvent.room}</ThemedText>
      </ContentCard>

      <ContentCard label="LATEST UPDATE" title="Welcome to KAMUN 2026">
        <ThemedText themeColor="textSecondary">
          The live announcement feed will appear here as soon as the Supabase project is connected.
        </ThemedText>
      </ContentCard>

      <View style={styles.stats}>
        <View style={[styles.stat, { borderColor: theme.border }]}>
          <ThemedText type="subtitle">3</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">conference days</ThemedText>
        </View>
        <View style={[styles.stat, { borderColor: theme.border }]}>
          <ThemedText type="subtitle">KIT</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Karlsruhe</ThemedText>
        </View>
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        {demoConference.dates} · Sample content
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  committee: { borderRadius: 24, gap: 6, padding: 22 },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, borderWidth: 1, borderRadius: 20, padding: 18, gap: 4 },
  onAccent: { color: '#FFFFFF' },
  onAccentSecondary: { color: '#D8F3F0' },
});
