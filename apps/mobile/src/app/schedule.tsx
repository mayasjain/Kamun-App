import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Brand, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAttendeeProfile } from '@/contexts/attendee-profile';
import { useConferenceContent } from '@/contexts/conference-content';
import { formatDay, formatEventTime } from '@/lib/date-format';
import { scheduleVenueMapUrl } from '@/lib/schedule-maps';

const palette = {
  black: Brand.black,
  cream: Brand.cream,
  green: Brand.pine,
  white: Brand.white,
  muted: '#D6E2D9',
  divider: 'rgba(255, 255, 255, 0.24)',
};

// Cuisine assignments for the published KAMUN 2026 meal slots.
const mealCuisines: Record<string, string> = {
  'fc55765a-4b11-516c-b11d-cb0cbf872aa0': 'Turkish', // Friday takeaway
  '056075a5-d98c-5d12-8ec8-d276d38ae0a7': 'German', // Saturday breakfast
  'eef16e3a-1b4b-513a-ab22-a48cd3f24a67': 'Arabic', // Saturday lunch
  '7930e643-081c-5700-bd2c-f07383460419': 'Chinese', // Saturday takeaway
  'a254ae7b-be9a-5f20-bb89-53183e9029ce': 'German', // Sunday breakfast
  '35ef9bd9-f8ca-57c0-a3a7-9be49520b240': 'Indian', // Sunday lunch
};

const cuisineFlags: Record<string, string> = { German: '🇩🇪', Turkish: '🇹🇷', Chinese: '🇨🇳', Indian: '🇮🇳', Arabic: '🇸🇦' };

export default function ScheduleScreen() {
  const [mapError, setMapError] = useState('');
  const { profile } = useAttendeeProfile();
  const { content, error, isLoading, source, refresh } = useConferenceContent();
  const events = content?.scheduleEvents ?? [];
  const groupedEvents = events.reduce<Record<string, typeof events>>((groups, event) => {
    const day = formatDay(event.startsAt);
    (groups[day] ??= []).push(event);
    return groups;
  }, {});
  const audience = profile?.committeeAbbreviation ?? profile?.accessLabel ?? 'KAMUN 2026';

  async function openMap(url: string) {
    setMapError('');
    try {
      await Linking.openURL(url);
    } catch {
      setMapError('The map could not be opened on this device.');
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <ThemedText accessibilityRole="header" style={styles.headerTitle}>Schedule</ThemedText>
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
            <ThemedText accessibilityRole="header" style={styles.dayTitle}>{day.toUpperCase()}</ThemedText>
            {dayEvents.map((event, index) => {
              const roomName = event.eventType === 'session' && event.roomName === 'Committee rooms'
                ? content?.committees.find(committee => committee.id === profile?.committeeId)?.roomName ?? event.roomName
                : event.roomName;
              const mapUrl = scheduleVenueMapUrl(roomName);
              const cuisine = mealCuisines[event.id];
              return (
                <View key={event.id} style={[styles.event, index > 0 && styles.eventDivider]}>
                  <View style={styles.eventHeading}>
                    <ThemedText style={[styles.eventTitle, styles.headingTitle]}>{event.title}</ThemedText>
                    {cuisine ? <View style={styles.cuisineBadge}><ThemedText accessibilityLabel={`${cuisine} cuisine`} style={styles.cuisineText}>{cuisineFlags[cuisine] ? `${cuisineFlags[cuisine]} ` : ''}{cuisine} cuisine</ThemedText></View> : null}
                  </View>
                  <ThemedText style={styles.eventDetail}>
                    {formatEventTime(event.startsAt, event.endsAt)}
                  </ThemedText>
                  {mapUrl ? (
                    <Pressable accessibilityRole="link" accessibilityLabel={`View ${roomName} on Google Maps`}
                      onPress={() => void openMap(mapUrl)} style={({ pressed }) => [styles.mapLink, pressed && styles.pressed]}>
                      <ThemedText style={styles.mapLinkText}>{roomName} ↗</ThemedText>
                    </Pressable>
                  ) : <ThemedText style={styles.eventDetail}>{roomName || 'Venue to be announced'}</ThemedText>}
                  {event.description ? <ThemedText style={styles.eventDescription}>{event.description}</ThemedText> : null}
                </View>
              );
            })}
          </View>
        ))}
        {!events.length ? (
          <View style={styles.dayPanel}>
            <ThemedText style={styles.eventTitle}>{isLoading ? 'Loading schedule…' : 'Schedule coming soon'}</ThemedText>
            <ThemedText style={styles.eventDetail}>Pull down to check for the latest programme.</ThemedText>
          </View>
        ) : null}
        {error ? <ThemedText accessibilityRole="alert" style={styles.status}>{error}</ThemedText> : null}
        {mapError ? <ThemedText accessibilityRole="alert" style={styles.status}>{mapError}</ThemedText> : null}
        {source === 'cache' ? <ThemedText style={styles.status}>Showing the last saved offline copy.</ThemedText> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.cream },
  header: { backgroundColor: palette.cream, paddingTop: Spacing.four, paddingBottom: Spacing.four },
  headerInner: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: Spacing.three, gap: 4 },
  headerTitle: { color: palette.green, fontSize: 34, lineHeight: 40, fontWeight: '400' },
  headerSubtitle: { color: '#5E625A', fontSize: 16, lineHeight: 22 },
  scroll: { flex: 1, backgroundColor: palette.cream },
  content: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: BottomTabInset + Spacing.five, gap: Spacing.three },
  dayPanel: { backgroundColor: palette.green, borderRadius: 24, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three },
  dayTitle: { color: palette.muted, fontSize: 13, lineHeight: 20, fontWeight: '500', letterSpacing: 1.6, marginBottom: 4 },
  event: { paddingVertical: Spacing.three, gap: 2 },
  eventDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.divider },
  eventHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 10, rowGap: 6, marginBottom: 4 },
  headingTitle: { flexShrink: 1 },
  cuisineBadge: { alignSelf: 'center', maxWidth: '100%', backgroundColor: palette.cream, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  cuisineText: { color: palette.green, fontSize: 12, lineHeight: 18, fontWeight: '500' },
  eventTitle: { color: palette.white, fontSize: 18, lineHeight: 24, fontWeight: '500' },
  eventDetail: { color: palette.muted, fontSize: 15, lineHeight: 21, fontStyle: 'italic' },
  eventDescription: { color: palette.white, fontSize: 14, lineHeight: 20, marginTop: 4 },
  mapLink: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: Spacing.one, maxWidth: '100%', minHeight: 44, paddingRight: Spacing.three },
  mapLinkText: { color: palette.white, fontSize: 15, lineHeight: 21, textDecorationLine: 'underline', flexShrink: 1 },
  pressed: { opacity: 0.7 },
  status: { color: palette.black, fontSize: 14, lineHeight: 20 },
});
