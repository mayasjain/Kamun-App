import { useEffect, useState } from 'react';
import { Link, type Href } from 'expo-router';
import { AppState, Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, Fonts, MaxContentWidth } from '@/constants/theme';
import { useAttendeeProfile } from '@/contexts/attendee-profile';
import { useConferenceContent } from '@/contexts/conference-content';
import { useTheme } from '@/hooks/use-theme';
import { formatEventTime } from '@/lib/date-format';

function getGreeting(now: number) {
  const hour = new Date(now).getHours();
  if (hour < 12) return { text: 'Good morning', symbol: '☀️' };
  if (hour < 18) return { text: 'Good afternoon', symbol: '🌲' };
  return { text: 'Good evening', symbol: '🌙' };
}

function getCountdown(now: number, startsAt?: string, endsAt?: string) {
  const start = startsAt ? Date.parse(startsAt) : NaN;
  const end = endsAt ? Date.parse(endsAt) : NaN;
  if (!Number.isFinite(start)) return { label: 'CONFERENCE', value: 'See you in Karlsruhe' };
  if (Number.isFinite(end) && now >= end) return { label: 'UNTIL NEXT TIME', value: 'Thank you for joining us' };
  if (now >= start) return { label: 'WELCOME TO KAMUN', value: 'The summit is underway' };
  const distance = start - now;
  const days = Math.floor(distance / 86_400_000);
  const hours = Math.floor((distance % 86_400_000) / 3_600_000);
  const minutes = Math.floor((distance % 3_600_000) / 60_000);
  return { label: 'KAMUN STARTS IN', value: `${days}d ${hours}h ${minutes}m` };
}

type ExploreItem = { icon: string; title: string; subtitle: string; href: Href };

const exploreItems: ExploreItem[] = [
  { icon: '📅', title: 'Schedule', subtitle: 'Full programme', href: '/schedule' },
  { icon: '📍', title: 'Locations', subtitle: 'Venue details', href: '/more' },
  { icon: '📣', title: 'Updates', subtitle: 'Announcements', href: '/updates' },
  { icon: '📖', title: 'Resources', subtitle: 'Guides & policies', href: '/resources' },
  { icon: '🛡️', title: 'Emergency', subtitle: 'Safety contacts', href: '/more' },
  { icon: '🌐', title: 'Committees', subtitle: 'Topics & chairs', href: '/committees' },
];

function SectionHeading({ children, action }: { children: string; action?: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.sectionHeading}>
      <ThemedText type="smallBold" style={[styles.sectionLabel, { color: theme.primary }]}>{children}</ThemedText>
      {action}
    </View>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 360 || fontScale > 1.2;
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(Date.now());
    });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);
  const { profile } = useAttendeeProfile();
  const { content, error, isLoading, source } = useConferenceContent();
  const nextEvent = content?.scheduleEvents.find((event) => Date.parse(event.endsAt) > now);
  const announcement = content?.announcements[0];
  const greeting = getGreeting(now);
  const countdown = getCountdown(now, content?.conference.startsAt, content?.conference.endsAt);
  const dateLabel = content ? new Date(content.conference.startsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: content.conference.timezone }) : 'Conference dates coming soon';
  const committeeTitle = profile?.committeeAbbreviation ?? profile?.accessLabel ?? 'KAMUN attendee';

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.hero} edges={['top']}>
        <View style={[styles.heroInner, compact && styles.heroCompact]}>
          <View style={styles.brandLockup}>
            <Image accessibilityLabel="KAMUN Black Forest Summit logo" resizeMode="contain" source={require('../../assets/branding/kamun-logo-v2.png')} style={styles.logo} />
            <View style={styles.brandCopy}>
              <ThemedText style={styles.brandName}>KAMUN</ThemedText>
              <ThemedText type="small" style={styles.brandTagline}>BLACK FOREST SUMMIT</ThemedText>
            </View>
          </View>
          <View style={styles.dates}>
            <ThemedText type="smallBold" style={styles.dateText}>{content ? new Date(content.conference.startsAt).toLocaleDateString('en-GB', { month: 'short', timeZone: content.conference.timezone }).toUpperCase() : 'KAMUN'}</ThemedText>
            <ThemedText type="smallBold" style={styles.dateText}>{content ? `${new Date(content.conference.startsAt).toLocaleDateString('en-GB', { day: 'numeric', timeZone: content.conference.timezone })}–${new Date(content.conference.endsAt).toLocaleDateString('en-GB', { day: 'numeric', timeZone: content.conference.timezone })}` : '2026'}</ThemedText>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.greetingRow}>
          <ThemedText style={[styles.greeting, { color: theme.primary }]}>{greeting.text}</ThemedText>
          <ThemedText style={styles.greetingSymbol}>{greeting.symbol}</ThemedText>
        </View>

        <View style={styles.section}>
          <SectionHeading>{profile?.committeeAbbreviation ? 'YOUR COMMITTEE' : 'YOUR CONFERENCE ACCESS'}</SectionHeading>
          <Link href="/committees" asChild>
            <Pressable accessibilityRole="link" style={({ pressed }) => [styles.committeeCard, pressed && styles.pressed]}>
              <View style={styles.committeeBadge}><ThemedText type="smallBold" style={styles.badgeText}>{profile?.committeeAbbreviation ?? (profile?.accessType === 'chair' ? 'CHAIR' : 'MEMBER')}</ThemedText></View>
              <View style={styles.committeeCopy}>
                <ThemedText type="subtitle" style={styles.lightText}>{committeeTitle}</ThemedText>
                <ThemedText style={styles.mutedLightText}>{profile?.committeeName ?? 'Explore committees, topics and chairs'}</ThemedText>
              </View>
              <ThemedText style={styles.cardArrow}>→</ThemedText>
            </Pressable>
          </Link>
        </View>

        <View style={styles.section}>
          <SectionHeading action={<Link href="/updates" asChild><Pressable accessibilityRole="link" hitSlop={8}><ThemedText type="smallBold" style={{ color: theme.primary }}>See all →</ThemedText></Pressable></Link>}>
            LATEST ANNOUNCEMENT
          </SectionHeading>
          <Link href="/updates" asChild>
            <Pressable accessibilityRole="link" style={({ pressed }) => [styles.announcementCard, { backgroundColor: theme.backgroundElement, borderColor: theme.accent }, pressed && styles.pressed]}>
              <ThemedText type="smallBold">{announcement?.title ?? (isLoading ? 'Loading updates…' : 'Welcome to KAMUN 2026')}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>{announcement?.body ?? 'Important conference information will appear here.'}</ThemedText>
              <ThemedText type="smallBold" style={{ color: theme.primary }}>Tap for details →</ThemedText>
            </Pressable>
          </Link>
        </View>

        {nextEvent ? (
          <View style={[styles.nextEvent, { backgroundColor: theme.primarySoft }]}>
            <ThemedText type="smallBold" style={{ color: theme.primary }}>UP NEXT</ThemedText>
            <ThemedText type="subtitle">{nextEvent.title}</ThemedText>
            <ThemedText themeColor="textSecondary">{formatEventTime(nextEvent.startsAt, nextEvent.endsAt)} · {nextEvent.roomName ?? 'Room TBA'}</ThemedText>
          </View>
        ) : null}

        <View style={styles.section}>
          <SectionHeading>COUNTDOWN</SectionHeading>
          <View style={[styles.countdownCard, { backgroundColor: Brand.pine }]}>
            <ThemedText type="smallBold" style={styles.countdownLabel}>{countdown.label}</ThemedText>
            <ThemedText style={styles.countdownValue}>{countdown.value}</ThemedText>
            <ThemedText style={styles.countdownMeta}>{dateLabel} · Karlsruhe</ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeading>EXPLORE</SectionHeading>
          <View style={styles.exploreGrid}>
            {exploreItems.map((item) => (
              <Link href={item.href} asChild key={item.title}>
                <Pressable accessibilityLabel={`${item.title}, ${item.subtitle}`} accessibilityRole="link" style={({ pressed }) => [styles.exploreCard, compact && styles.exploreCardCompact, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, pressed && styles.pressed]}>
                  <ThemedText style={styles.exploreIcon}>{item.icon}</ThemedText>
                  <ThemedText type="smallBold" style={styles.exploreTitle}>{item.title}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.exploreSubtitle}>{item.subtitle}</ThemedText>
                </Pressable>
              </Link>
            ))}
          </View>
        </View>

        {source === 'cache' || error ? <ThemedText type="small" themeColor="textSecondary">{source === 'cache' ? 'Showing saved conference information.' : 'Live updates are temporarily unavailable.'}</ThemedText> : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { alignItems: 'center', backgroundColor: Brand.black },
  heroInner: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', maxWidth: MaxContentWidth, paddingHorizontal: 22, paddingVertical: 22, width: '100%' },
  heroCompact: { flexWrap: 'wrap', gap: 12 },
  brandLockup: { flexShrink: 1, alignItems: 'center', flexDirection: 'row', gap: 12 },
  logo: { height: 62, width: 62 },
  brandCopy: { gap: 1, flexShrink: 1 },
  brandName: { color: Brand.cream, fontSize: 28, fontWeight: '800', letterSpacing: 1.2, lineHeight: 34 },
  brandTagline: { color: Brand.gold, fontSize: 10, letterSpacing: 1.6 },
  dates: { alignItems: 'flex-end' },
  dateText: { color: Brand.cream, letterSpacing: 1.4 },
  content: { alignSelf: 'center', gap: 28, maxWidth: MaxContentWidth, paddingBottom: Math.max(BottomTabInset, 80) + 34, paddingHorizontal: 20, paddingTop: 30, width: '100%' },
  greetingRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  greeting: { fontFamily: Fonts.serif, fontSize: 31, fontStyle: 'italic', lineHeight: 38 },
  greetingSymbol: { fontSize: 28 },
  section: { gap: 12 },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  sectionLabel: { fontSize: 12, letterSpacing: 2.2 },
  committeeCard: { alignItems: 'center', backgroundColor: Brand.black, borderRadius: 22, flexDirection: 'row', gap: 16, minHeight: 116, padding: 18 },
  committeeBadge: { alignItems: 'center', backgroundColor: Brand.gold, borderRadius: 16, justifyContent: 'center', minHeight: 74, width: 74, padding: 8 },
  badgeText: { color: Brand.black, fontSize: 12, textAlign: 'center' },
  committeeCopy: { minWidth: 0, flex: 1, gap: 4 },
  lightText: { color: Brand.cream },
  mutedLightText: { color: '#BBB8AE', fontFamily: Fonts.serif, fontStyle: 'italic' },
  cardArrow: { color: Brand.gold, fontSize: 23 },
  announcementCard: { borderLeftWidth: 6, borderRadius: 18, gap: 7, padding: 18 },
  nextEvent: { borderRadius: 18, gap: 5, padding: 18 },
  countdownCard: { borderRadius: 22, gap: 5, padding: 22 },
  countdownLabel: { color: '#D7E3D8', fontSize: 11, letterSpacing: 1.2 },
  countdownValue: { color: Brand.white, fontSize: 35, fontWeight: '800', letterSpacing: -0.5, lineHeight: 42 },
  countdownMeta: { color: '#D7E3D8', fontFamily: Fonts.serif, fontStyle: 'italic' },
  exploreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  exploreCard: { alignItems: 'center', borderRadius: 18, borderWidth: 1, flexBasis: '31%', flexGrow: 1, gap: 3, justifyContent: 'center', minHeight: 128, padding: 10 },
  exploreCardCompact: { flexBasis: '46%' },
  exploreIcon: { fontSize: 27, lineHeight: 34 },
  exploreTitle: { textAlign: 'center' },
  exploreSubtitle: { fontFamily: Fonts.serif, fontSize: 12, fontStyle: 'italic', lineHeight: 16, textAlign: 'center' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});
