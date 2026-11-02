import { useEffect, useState } from 'react';
import { Link, useRouter, type Href } from 'expo-router';
import { AppState, Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useAttendeeProfile } from '@/contexts/attendee-profile';
import { AccessExpiredError } from '@/lib/function-errors';
import { useConferenceContent } from '@/contexts/conference-content';
import { useTheme } from '@/hooks/use-theme';
import { formatEventTime } from '@/lib/date-format';

import { openEcgWithKamunIdentity } from '@/lib/ecg-handoff';

type QuickLink = { title: string; detail: string; href: Href; symbol: string; urgent?: boolean };

const quickLinks: QuickLink[] = [
  { title: 'Emergency', detail: 'Help and contacts', href: '/emergency', symbol: '!' , urgent: true },
  { title: 'Gossip box', detail: 'Send a message', href: '/gossip', symbol: '✉' },
];

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { profile, clearProfile, restoreError } = useAttendeeProfile();
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 375 || fontScale > 1.2;
  const [now, setNow] = useState(Date.now);
  const [openingEcg, setOpeningEcg] = useState(false);
  const [ecgError, setEcgError] = useState<string | null>(null);
  async function openEcg() {
    if (openingEcg) return;
    setEcgError(null);
    setOpeningEcg(true);
    try {
      if (profile?.identitySource !== 'ecg') {
        throw new Error('Use your personal ECE code in More → Change access code to connect coffee ordering.');
      }
      await openEcgWithKamunIdentity();
    }
    catch (error) {
      if (error instanceof AccessExpiredError) clearProfile();
      setEcgError(error instanceof Error ? error.message : 'ECE is unavailable right now.');
    } finally { setOpeningEcg(false); }
  }

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(Date.now());
    });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);

  const { content, error, isLoading, source } = useConferenceContent();
  const nextEvent = content?.scheduleEvents.find((event) => Date.parse(event.endsAt) > now);
  const announcement = content?.announcements[0];
  const urgentAnnouncement = announcement?.priority === 'urgent';

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.masthead}>
            <Image accessibilityLabel="KAMUN crest" resizeMode="contain" source={require('../../assets/branding/kamun-logo-v2.png')} style={styles.mastheadLogo} />
            <View style={styles.mastheadCopy}>
              <ThemedText type="smallBold" style={[styles.mastheadTitle, { color: theme.text }]}>KAMUN 2026</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Black Forest Summit · Karlsruhe</ThemedText>
            </View>
            <View style={[styles.dateBadge, { backgroundColor: theme.primarySoft }]}>
              <ThemedText type="smallBold" style={{ color: theme.primary }}>13–15 NOV</ThemedText>
            </View>
          </View>

          <View accessible accessibilityLabel="KAMUN 2026 banner showing Karlsruhe Palace and the Black Forest" style={[styles.hero, compact && styles.heroCompact]}>
            <Image source={require('../../assets/branding/kamun-banner.png')} resizeMode="cover" style={styles.heroArt} accessible={false} />
            <View style={styles.heroCopy}>
              <ThemedText type="smallBold" style={styles.heroEyebrow}>KARLSRUHE · 2026</ThemedText>
              <ThemedText style={[styles.heroTitle, compact && styles.heroTitleCompact]}>Diplomacy in the heart of the Black Forest.</ThemedText>
            </View>
          </View>

          <View style={styles.introduction}>
            <View style={[styles.rule, { backgroundColor: theme.accent }]} />
            <View style={styles.introductionCopy}>
              <ThemedText type="smallBold" style={[styles.eyebrow, { color: theme.primary }]}>YOUR CONFERENCE</ThemedText>
              <ThemedText style={[styles.pageTitle, { color: theme.text }]}>Today at KAMUN</ThemedText>
              <ThemedText themeColor="textSecondary">Your programme, official updates and essential conference information.</ThemedText>
            </View>
          </View>

          <Link href="/schedule" asChild>
            <Pressable accessibilityRole="link" accessibilityLabel={nextEvent ? `Next event: ${nextEvent.title}. Open schedule` : 'Open conference schedule'} style={({ pressed }) => [styles.scheduleCard, pressed && styles.pressed]}>
              <View style={styles.scheduleTopline}>
                <View style={styles.scheduleLabelRow}>
                  <ThemedText type="smallBold" style={styles.scheduleEyebrow}>UP NEXT</ThemedText>
                </View>
                <ThemedText type="smallBold" style={styles.scheduleLink}>Next on your programme</ThemedText>
              </View>
              <ThemedText style={styles.eventTitle}>{nextEvent?.title ?? (isLoading ? 'Loading programme…' : 'No upcoming sessions')}</ThemedText>
              <ThemedText style={styles.eventDetail}>
                {nextEvent ? `${formatEventTime(nextEvent.startsAt, nextEvent.endsAt)}${nextEvent.roomName ? ` · ${nextEvent.roomName}` : ''}` : 'Open the programme to review the conference schedule.'}
              </ThemedText>
              <View style={styles.scheduleAction}>
                <ThemedText type="smallBold" style={styles.scheduleActionText}>Open full schedule</ThemedText>
              </View>
            </Pressable>
          </Link>

          <View style={styles.section}>
            <View style={styles.sectionHeading}>
              <View>
                <ThemedText type="smallBold" style={[styles.eyebrow, { color: theme.primary }]}>LATEST UPDATE</ThemedText>
                <ThemedText type="subtitle" style={styles.sectionTitle}>From the organisers</ThemedText>
              </View>
              <Link href="/updates" asChild>
                <Pressable accessibilityRole="link" hitSlop={8} style={styles.textLink}>
                  <ThemedText type="smallBold" style={{ color: theme.primary }}>All updates</ThemedText>
                </Pressable>
              </Link>
            </View>
            <Link href="/updates" asChild>
              <Pressable accessibilityRole="link" accessibilityLabel={`View updates. ${announcement?.title ?? 'No new announcement'}`} style={({ pressed }) => [styles.updateCard, { backgroundColor: theme.backgroundElement, borderColor: urgentAnnouncement ? theme.danger : theme.border }, pressed && styles.pressed]}>
                {urgentAnnouncement ? <View style={[styles.statusBadge, { backgroundColor: theme.danger }]}>
                  <ThemedText type="smallBold" style={{ color: Brand.white }}>URGENT</ThemedText>
                </View> : null}
                <ThemedText type="subtitle" style={styles.updateTitle}>{announcement?.title ?? (isLoading ? 'Loading updates…' : 'No new announcements')}</ThemedText>
                <ThemedText themeColor="textSecondary" numberOfLines={3}>{announcement?.body ?? 'Organiser messages will appear here when published.'}</ThemedText>
                <ThemedText type="smallBold" style={{ color: theme.primary }}>Read all updates</ThemedText>
              </Pressable>
            </Link>
          </View>

          <View style={styles.section}>
            <View>
              <ThemedText type="smallBold" style={[styles.eyebrow, { color: theme.primary }]}>QUICK ACCESS</ThemedText>
            </View>
            <View style={[styles.quickList, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
              <Pressable onPress={() => void openEcg()} disabled={openingEcg}
                accessibilityRole="link" accessibilityLabel="Open ECE coffee ordering"
                accessibilityState={{ busy: openingEcg, disabled: openingEcg }}
                style={({ pressed }) => [styles.quickRow, pressed && styles.pressed]}>
                <View style={[styles.quickIcon, { backgroundColor: theme.primarySoft }]}>
                  <ThemedText style={[styles.quickSymbol, { color: theme.primary }]}>☕</ThemedText>
                </View>
                <View style={styles.quickCopy}>
                  <ThemedText type="smallBold" style={styles.quickTitle}>ECE coffee bar</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">{openingEcg ? 'Opening ECE…' : 'Order and track your coffee'}</ThemedText>
                </View>
                <ThemedText accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.quickArrow, { color: theme.primary }]}>→</ThemedText>
              </Pressable>
              {quickLinks.map((item) => (
                <Pressable key={item.title} onPress={() => router.push(item.href)} accessibilityRole="link" accessibilityLabel={`${item.title}, ${item.detail}`} style={({ pressed }) => [styles.quickRow, { borderTopWidth: 1, borderTopColor: theme.border }, pressed && styles.pressed]}>
                  <View style={[styles.quickIcon, { backgroundColor: item.urgent ? theme.danger : theme.primarySoft }]}>
                    <ThemedText style={[styles.quickSymbol, { color: item.urgent ? Brand.white : theme.primary }]}>{item.symbol}</ThemedText>
                  </View>
                  <View style={styles.quickCopy}>
                    <ThemedText type="smallBold" style={styles.quickTitle}>{item.title}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">{item.detail}</ThemedText>
                  </View>
                  <ThemedText accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.quickArrow, { color: theme.primary }]}>→</ThemedText>
                </Pressable>
              ))}
            </View>
            {ecgError ? <ThemedText accessibilityRole="alert" type="small" style={{ color: theme.danger }}>{ecgError}</ThemedText> : null}
          </View>

          {source === 'cache' || error || restoreError ? (
            <View accessibilityRole="alert" style={[styles.connectionNotice, { backgroundColor: theme.primarySoft, borderColor: theme.border }]}>
              <ThemedText type="smallBold" style={{ color: theme.primary }}>{source === 'cache' ? 'Saved information' : 'Live updates unavailable'}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">{restoreError ?? (source === 'cache' ? 'You are viewing the latest conference information saved on this device.' : 'Check your connection and try again shortly.')}</ThemedText>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  content: { alignSelf: 'center', gap: Spacing.five, maxWidth: MaxContentWidth, paddingBottom: Math.max(BottomTabInset, 80) + Spacing.five, paddingHorizontal: 20, paddingTop: Spacing.two, width: '100%' },
  masthead: { alignItems: 'center', flexDirection: 'row', gap: Spacing.twoAndHalf, minHeight: 64 },
  mastheadLogo: { height: 52, width: 52 },
  mastheadCopy: { flex: 1, gap: 1, minWidth: 0 },
  mastheadTitle: { fontSize: 17, letterSpacing: 0.8 },
  dateBadge: { borderRadius: Radius.pill, paddingHorizontal: Spacing.twoAndHalf, paddingVertical: Spacing.two },
  hero: { backgroundColor: Brand.black, borderRadius: Radius.feature, height: 244, justifyContent: 'flex-end', overflow: 'hidden', width: '100%' },
  heroCompact: { height: 210 },
  heroArt: { ...StyleSheet.absoluteFill, height: '100%', width: '100%' },
  heroCopy: { gap: Spacing.two, maxWidth: 520, padding: Spacing.four },
  heroEyebrow: { color: Brand.gold, fontSize: 12, letterSpacing: 1.8 },
  heroTitle: { color: Brand.white, fontFamily: Fonts?.serif, fontSize: 34, fontWeight: '700', lineHeight: 39 },
  heroTitleCompact: { fontSize: 28, lineHeight: 33 },
  introduction: { alignItems: 'flex-start', flexDirection: 'row', gap: Spacing.three },
  rule: { borderRadius: 2, height: 56, marginTop: 3, width: 4 },
  introductionCopy: { flex: 1, gap: Spacing.one },
  eyebrow: { fontSize: 12, letterSpacing: 1.5 },
  pageTitle: { fontFamily: Fonts?.serif, fontSize: 30, fontWeight: '700', lineHeight: 36 },
  scheduleCard: { backgroundColor: Brand.parchment, borderColor: Brand.goldDark, borderRadius: Radius.feature, borderWidth: 2, gap: Spacing.three, minHeight: 240, padding: Spacing.four },
  scheduleTopline: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, justifyContent: 'space-between' },
  scheduleLabelRow: { alignItems: 'center', backgroundColor: Brand.gold, borderRadius: Radius.pill, flexDirection: 'row', minHeight: 32, paddingHorizontal: Spacing.twoAndHalf, paddingVertical: 6 },
  scheduleEyebrow: { color: Brand.black, fontSize: 12, letterSpacing: 1.5 },
  scheduleLink: { color: Brand.pine },
  eventTitle: { color: Brand.black, fontFamily: Fonts?.serif, fontSize: 28, fontWeight: '700', lineHeight: 36 },
  eventDetail: { color: Brand.pine, fontSize: 16, fontWeight: '600', lineHeight: 24 },
  scheduleAction: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: Brand.gold, borderRadius: Radius.control, justifyContent: 'center', minHeight: 52, paddingHorizontal: Spacing.three },
  scheduleActionText: { color: Brand.black },
  section: { gap: Spacing.three },
  sectionHeading: { alignItems: 'flex-end', flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, justifyContent: 'space-between' },
  sectionTitle: { fontFamily: Fonts?.serif, fontSize: 24, lineHeight: 30, marginTop: 2 },
  textLink: { justifyContent: 'center', minHeight: 44, paddingHorizontal: Spacing.one },
  updateCard: { borderLeftWidth: 4, borderRadius: Radius.card, borderWidth: 1, gap: Spacing.twoAndHalf, minHeight: 156, padding: 20 },
  statusBadge: { borderRadius: Radius.pill, paddingHorizontal: Spacing.twoAndHalf, paddingVertical: 6 },
  updateTitle: { fontFamily: Fonts?.serif, fontSize: 21, lineHeight: 27 },
  quickList: { borderRadius: 18, borderWidth: 1, maxWidth: 680, overflow: 'hidden', width: '100%' },
  quickRow: { alignItems: 'center', flexDirection: 'row', gap: 13, minHeight: 76, paddingHorizontal: 16, paddingVertical: 12, width: '100%' },
  quickIcon: { alignItems: 'center', borderRadius: 12, height: 44, justifyContent: 'center', width: 44 },
  quickSymbol: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  quickCopy: { flex: 1, gap: 2, minWidth: 0 },
  quickTitle: { fontSize: 16 },
  quickArrow: { fontSize: 22, lineHeight: 28, marginLeft: 4 },
  connectionNotice: { borderRadius: Radius.card, borderWidth: 1, gap: Spacing.one, padding: Spacing.three },
  pressed: { opacity: 0.76 },
});
