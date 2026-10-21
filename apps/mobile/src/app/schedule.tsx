import { StatusBar } from 'expo-status-bar';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Brand, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAttendeeProfile } from '@/contexts/attendee-profile';
import { useConferenceContent } from '@/contexts/conference-content';
import { formatDay, formatEventTime } from '@/lib/date-format';

const palette = {
  black: Brand.black,
  cream: Brand.cream,
  green: Brand.pine,
  white: Brand.white,
  muted: '#D6E2D9',
  divider: 'rgba(255, 255, 255, 0.24)',
};

export default function ScheduleScreen() {
  const { profile } = useAttendeeProfile();
  const { content, error, isLoading, source, refresh } = useConferenceContent();
  const events = content?.scheduleEvents ?? [];
  const groupedEvents = events.reduce<Record<string, typeof events>>((groups, event) => {
    const day = formatDay(event.startsAt);
    (groups[day] ??= []).push(event);
    return groups;
  }, {});
  const audience = profile?.committeeAbbreviation ?? profile?.accessLabel ?? 'KAMUN 2026';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <ThemedText style={styles.headerTitle}>Schedule</ThemedText>
          <ThemedText style={styles.headerSubtitle}>{audience} · KAMUN 2026</ThemedText>
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => void refresh()} tintColor={palette.green} />}>
        {Object.entries(groupedEvents).map(([day, dayEvents]) => (
          <View key={day} style={styles.dayPanel}>
            <ThemedText style={styles.dayTitle}>{day.toUpperCase()}</ThemedText>
            {dayEvents.map((event, index) => (
              <View key={event.id} style={[styles.event, index > 0 && styles.eventDivider]}>
                <ThemedText style={styles.eventTitle}>{event.title}</ThemedText>
                <ThemedText style={styles.eventDetail}>
                  {formatEventTime(event.startsAt, event.endsAt)} · {event.roomName || 'Venue to be announced'}
                </ThemedText>
              </View>
            ))}
          </View>
        ))}
        {!events.length ? (
          <View style={styles.dayPanel}>
            <ThemedText style={styles.eventTitle}>{isLoading ? 'Loading schedule…' : 'Schedule coming soon'}</ThemedText>
            <ThemedText style={styles.eventDetail}>Pull down to check for the latest programme.</ThemedText>
          </View>
        ) : null}
        {error ? <ThemedText accessibilityRole="alert" style={styles.status}>{error}</ThemedText> : null}
        {source === 'cache' ? <ThemedText style={styles.status}>Showing the last saved offline copy.</ThemedText> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.black },
  header: { backgroundColor: palette.black, paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: Spacing.four },
  headerInner: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: 4 },
  headerTitle: { color: palette.white, fontSize: 34, lineHeight: 40, fontWeight: '700' },
  headerSubtitle: { color: palette.muted, fontSize: 16, lineHeight: 22, fontStyle: 'italic' },
  scroll: { flex: 1, backgroundColor: palette.cream },
  content: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: BottomTabInset + Spacing.five, gap: Spacing.three },
  dayPanel: { backgroundColor: palette.green, borderRadius: 24, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three },
  dayTitle: { color: palette.muted, fontSize: 13, lineHeight: 20, fontWeight: '800', letterSpacing: 1.6, marginBottom: 4 },
  event: { paddingVertical: Spacing.three, gap: 2 },
  eventDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.divider },
  eventTitle: { color: palette.white, fontSize: 18, lineHeight: 24, fontWeight: '700' },
  eventDetail: { color: palette.muted, fontSize: 15, lineHeight: 21, fontStyle: 'italic' },
  status: { color: palette.black, fontSize: 14, lineHeight: 20 },
});
