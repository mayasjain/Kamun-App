import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ContentCard } from '@/components/content-card';
import { useConferenceContent } from '@/contexts/conference-content';
import { useTheme } from '@/hooks/use-theme';
import { formatDay, formatEventTime } from '@/lib/date-format';

export default function ScheduleScreen() {
  const theme = useTheme();
  const { content, error, isLoading, source, refresh } = useConferenceContent();
  const events = content?.scheduleEvents ?? [];
  const groupedEvents = events.reduce<Record<string, typeof events>>((groups, event) => {
    const day = formatDay(event.startsAt);
    (groups[day] ??= []).push(event);
    return groups;
  }, {});

  return (
    <Screen onRefresh={() => void refresh()} refreshing={isLoading} eyebrow="KAMUN 2026" title="Schedule" subtitle="Conference programme · available offline">
      {Object.entries(groupedEvents).map(([day, dayEvents]) => (
        <View key={day} style={styles.day}>
          <ThemedText type="subtitle" style={styles.dayTitle}>{day}</ThemedText>
          {dayEvents.map((event) => (
            <View key={event.id} style={styles.row}>
              <ThemedText type="smallBold" style={[styles.time, { color: theme.primary }]}>
                {formatEventTime(event.startsAt, event.endsAt)}
              </ThemedText>
              <View style={[styles.event, { borderColor: theme.border }]}>
                <ThemedText type="smallBold">{event.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{event.roomName ?? 'Room to be announced'}</ThemedText>
              </View>
            </View>
          ))}
        </View>
      ))}
      {!events.length ? (
        <ContentCard label="PROGRAMME" title={isLoading ? 'Loading schedule…' : 'Schedule coming soon'}>
          <ThemedText themeColor="textSecondary">The programme will appear after times and rooms are approved.</ThemedText>
        </ContentCard>
      ) : null}
      {error ? <ThemedText type="small" themeColor="danger">{error}</ThemedText> : null}
      {source === 'cache' ? <ThemedText type="small" themeColor="textSecondary">Showing the last saved offline copy.</ThemedText> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  day: { gap: 12 },
  dayTitle: { fontSize: 24, lineHeight: 30 },
  row: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  time: { width: 76, paddingTop: 15 },
  event: { flex: 1, borderLeftWidth: 2, padding: 14, gap: 4 },
});
