import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { demoSchedule } from '@/data/demo';
import { useTheme } from '@/hooks/use-theme';

export default function ScheduleScreen() {
  const theme = useTheme();

  return (
    <Screen eyebrow="FRIDAY" title="Schedule" subtitle="Conference programme · available offline">
      {demoSchedule.map((event) => (
        <View key={`${event.time}-${event.title}`} style={styles.row}>
          <ThemedText type="smallBold" style={[styles.time, { color: theme.primary }]}>
            {event.time}
          </ThemedText>
          <View style={[styles.event, { borderColor: theme.border }]}>
            <ThemedText type="smallBold">{event.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">{event.room}</ThemedText>
          </View>
        </View>
      ))}
      <ThemedText type="small" themeColor="textSecondary">
        Saturday and Sunday content will use the same day-grouped layout.
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  time: { width: 76, paddingTop: 15 },
  event: { flex: 1, borderLeftWidth: 2, padding: 14, gap: 4 },
});
