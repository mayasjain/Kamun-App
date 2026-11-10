import { useEffect, useState } from 'react';
import { HomeIcon } from '@/components/home-icon';
import { Link, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { AppState, Image, Linking, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useAttendeeProfile } from '@/contexts/attendee-profile';
import { AccessExpiredError } from '@/lib/function-errors';
import { useConferenceContent } from '@/contexts/conference-content';
import { useTheme } from '@/hooks/use-theme';
import { formatEventTime } from '@/lib/date-format';
import { conferenceDayLabel } from '@/lib/conference-day';
import { orderAnnouncements } from '@/lib/announcement-order';

import { openEcgWithKamunIdentity } from '@/lib/ecg-handoff';

type QuickLink = { title: string; detail: string; href: Href; urgent?: boolean; external?: boolean };

const quickLinks: QuickLink[] = [
  { title: 'Emergency', detail: 'Help & contacts', href: '/emergency', urgent: true },
  { title: 'Gossip Box', detail: 'Share a message', href: '/gossip' },
  { title: 'Song requests', detail: 'Send a song to the DJs', href: 'https://tally.so/r/NqDZPN', external: true },
  { title: 'Your KAMUN Padlet', detail: 'Meme it till you make it.', href: '/memes' },
  { title: 'Secretariat', detail: 'Meet the team', href: '/secretariat' },
  { title: 'Sponsors & Partners', detail: 'Our pillars of support', href: '/partners' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { previewDay } = useLocalSearchParams<{ previewDay?: string }>();
  // Preview only the badge; schedule timing and all other live data stay current.
  const previewBadge = previewDay === '1' ? 'Day 1 - 13 Nov'
    : previewDay === '2' ? 'Day 2 - 14 Nov'
    : previewDay === '3' ? 'Day 3 - 15 Nov' : undefined;
  const theme = useTheme();
  const { profile, clearProfile } = useAttendeeProfile();
  const { width, fontScale } = useWindowDimensions();
  const phone = width < 600;
  const compact = width < 375 || fontScale > 1.2;
  const [now, setNow] = useState(Date.now);
  const [openingEcg, setOpeningEcg] = useState(false);
  const [ecgError, setEcgError] = useState<string | null>(null);
  async function openEcg() {
    if (openingEcg || profile?.accessType === 'admin') return;
    setEcgError(null);
    setOpeningEcg(true);
    try {
      if (profile?.identitySource !== 'ecg') {
        throw new Error('Use your personal KAMUN code in More → Change access code to connect coffee ordering.');
      }
      await openEcgWithKamunIdentity();
    }
    catch (error) {
      if (error instanceof AccessExpiredError) clearProfile();
      setEcgError(error instanceof Error ? error.message : 'KAMUN coffee ordering is unavailable right now.');
    } finally { setOpeningEcg(false); }
  }

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(Date.now());
    });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);

  const { content, isLoading } = useConferenceContent();
  const nextEvent = content?.scheduleEvents.find((event) => Date.parse(event.endsAt) > now);
  const eventIsLive = nextEvent ? Date.parse(nextEvent.startsAt) <= now : false;
  const announcements = orderAnnouncements(content?.announcements ?? []);
  const urgentAnnouncements = announcements.filter(item => item.priority === 'urgent');
  const homeAnnouncements = urgentAnnouncements.length ? urgentAnnouncements : [announcements[0]];

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={[styles.content, phone && styles.phoneContent]} showsVerticalScrollIndicator={false}>
          <View style={[styles.masthead, compact && { flexWrap: 'wrap' }]}>
            <Image accessibilityLabel="KAMUN crest" resizeMode="contain" source={require('../../assets/branding/kamun-logo-v2.png')} style={[styles.mastheadLogo, phone && styles.mastheadLogoPhone]} />
            <View style={styles.mastheadCopy}>
              <ThemedText type="smallBold" style={[styles.mastheadTitle, { color: theme.text }]}>KAMUN 2026</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Black Forest Summit · Karlsruhe</ThemedText>
            </View>
            <View style={[styles.dateBadge, { backgroundColor: theme.primarySoft }]}>
              <ThemedText type="smallBold" style={{ color: theme.primary }}>{previewBadge ?? conferenceDayLabel(content?.conference, now)}</ThemedText>
            </View>
          </View>

          <View accessible accessibilityLabel="KAMUN 2026 banner showing Karlsruhe Palace and the Black Forest" style={[styles.hero, (compact || phone) && styles.heroCompact]}>
            <Image source={require('../../assets/branding/kamun-banner.png')} resizeMode="cover" style={styles.heroArt} accessible={false} />
            <View style={[styles.heroCopy, phone && styles.heroCopyPhone]}>
              <ThemedText type="smallBold" style={styles.heroEyebrow}>KARLSRUHE · 2026</ThemedText>
              <ThemedText style={[styles.heroTitle, (phone || compact) && styles.heroTitleCompact]}>Diplomacy in the heart of the Black Forest.</ThemedText>
            </View>
          </View>

          <Link href="/schedule" asChild>
            <Pressable accessibilityRole="link" accessibilityLabel={nextEvent ? `${eventIsLive ? "Happening now" : "Next event"}: ${nextEvent.title}. Open schedule` : 'Open conference schedule'} style={({ pressed }) => [styles.scheduleCard, phone && styles.scheduleCardPhone, pressed && styles.pressed]}>
              <View style={styles.scheduleTopline}>
                <View style={styles.scheduleLabelRow}>
                  <ThemedText type="smallBold" style={styles.scheduleEyebrow}>{eventIsLive ? 'HAPPENING NOW' : 'UP NEXT'}</ThemedText>
                </View>
              </View>
              <ThemedText style={[styles.eventTitle, phone && styles.eventTitlePhone]}>{nextEvent?.title ?? (isLoading ? 'Loading programme…' : 'No upcoming sessions')}</ThemedText>
              <ThemedText style={styles.eventDetail} themeColor="textSecondary">
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
                <ThemedText type="smallBold" style={[styles.eyebrow, { color: theme.primary }]}>{urgentAnnouncements.length ? 'IMPORTANT UPDATES' : 'LATEST UPDATE'}</ThemedText>
                <ThemedText accessibilityRole="header" type="subtitle" style={[styles.sectionTitle, phone && styles.sectionTitlePhone]}>{urgentAnnouncements.length ? 'Urgent updates' : 'Conference news'}</ThemedText>
              </View>
            </View>
            {homeAnnouncements.map(announcement => <Link key={announcement?.id ?? 'empty'} href="/updates" asChild>
              <Pressable accessibilityRole="link" accessibilityLabel={`${announcement?.priority === 'urgent' ? 'Urgent update' : 'View updates'}. ${announcement?.title ?? 'No new announcement'}`} style={({ pressed }) => [styles.updateCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderLeftColor: announcement?.priority === 'urgent' ? theme.danger : theme.accent }, pressed && styles.pressed]}>
                {announcement?.priority === 'urgent' ? <View style={[styles.statusBadge, { backgroundColor: theme.danger }]}>
                  <ThemedText type="smallBold" themeColor="onDanger">URGENT</ThemedText>
                </View> : null}
                <ThemedText accessibilityRole="header" type="subtitle" style={[styles.updateTitle, phone && styles.updateTitlePhone]}>{announcement?.title ?? (isLoading ? 'Loading updates…' : 'No new announcements')}</ThemedText>
                <ThemedText themeColor="textSecondary" style={phone && styles.bodyPhone} numberOfLines={3}>{announcement?.body ?? 'Organiser messages will appear here when published.'}</ThemedText>
                <View style={[styles.updateAction, { borderTopColor: theme.border }]}>
                  <ThemedText type="smallBold" style={{ color: theme.primary }}>Open updates</ThemedText>
                </View>
              </Pressable>
            </Link>)}
          </View>

          <View style={styles.section}>
            <View style={styles.essentialsHeading}>
              <ThemedText type="small" style={{ color: theme.primary }}>KAMUN 2026</ThemedText>
              <ThemedText accessibilityRole="header" type="subtitle" style={[styles.essentialsTitle, phone && styles.essentialsTitlePhone, { color: theme.primary }]}>Your essentials</ThemedText>
              <ThemedText themeColor="textSecondary" style={phone && styles.bodyPhone}>Everything you need, in one place.</ThemedText>
            </View>
            {profile?.accessType !== 'admin' && <View style={[styles.coffeeCard, phone && styles.coffeeCardPhone, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={[styles.coffeeTopline, compact && styles.coffeeToplineCompact]}>
                <View style={[styles.coffeeIcon, phone && styles.coffeeIconPhone, { backgroundColor: theme.primarySoft }]}>
                  <HomeIcon name="coffee" size={30} color={Brand.pine} />
                </View>
                <View style={styles.coffeeCopy}>
                  <ThemedText type="subtitle" style={[styles.coffeeTitle, phone && styles.coffeeTitlePhone, { color: theme.text }]}>ECE Coffee Bar</ThemedText>
                  <ThemedText style={[styles.coffeeDescription, { color: theme.textSecondary }]}>Your next coffee, one tap away</ThemedText>
                </View>
                {profile?.identitySource !== 'ecg' ? (
                  <View style={styles.setupBadge}>
                    <ThemedText type="smallBold" style={{ color: Brand.pine }}>Setup needed</ThemedText>
                  </View>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ busy: openingEcg, disabled: openingEcg }}
                disabled={openingEcg}
                onPress={() => profile?.identitySource === 'ecg' ? void openEcg() : router.push('/more')}
                style={({ pressed }) => [styles.coffeeButton, (pressed || openingEcg) && styles.pressed]}>
                <ThemedText type="smallBold" style={styles.coffeeButtonText}>
                  {openingEcg ? 'Opening ECE Coffee Bar…' : profile?.identitySource === 'ecg' ? 'Order coffee' : 'Connect coffee ordering'}
                </ThemedText>
              </Pressable>
            </View>}
            <View style={styles.quickGrid}>
              {quickLinks.slice(0, 4).map((item) => (
                <Pressable key={item.title} onPress={() => item.external ? void Linking.openURL(String(item.href)) : router.push(item.href)}
                  accessibilityRole="link" accessibilityLabel={`${item.title}, ${item.detail}${item.external ? ', opens in your browser' : ''}`}
                  style={({ pressed }) => [styles.quickTile, phone && styles.quickTilePhone, compact && styles.quickTileStacked, { backgroundColor: pressed ? theme.primarySoft : theme.backgroundElement, borderColor: theme.border }]}>
                  <View style={[styles.quickIcon, phone && styles.quickIconPhone, { backgroundColor: item.urgent ? `${theme.danger}12` : theme.primarySoft }]}>
                    {item.urgent
                      ? <HomeIcon name="emergency" size={27} color={theme.danger} />
                      : <HomeIcon name={item.external ? 'music' : item.href === '/secretariat' ? 'secretariat' : item.href === '/partners' ? 'partners' : item.href === '/memes' ? 'memes' : 'gossip'} size={27} color={theme.primary} />}
                  </View>
                  <View style={styles.quickCopy}>
                    <ThemedText type="smallBold" style={[styles.quickTitle, phone && styles.quickTitlePhone]}>{item.title}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={phone && styles.quickDetailPhone}>{item.detail}</ThemedText>
                  </View>
                </Pressable>
              ))}
            </View>
            <ThemedText accessibilityRole="header" type="small" style={[styles.conferenceLabel, { color: theme.primary }]}>CONFERENCE INFO</ThemedText>
            <View style={[styles.conferenceList, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              {quickLinks.slice(4).map((item, index) => (
                <Pressable key={item.title} onPress={() => router.push(item.href)}
                  accessibilityRole="link" accessibilityLabel={`${item.title}, ${item.detail}`}
                  style={({ pressed }) => [styles.conferenceRow, index > 0 && { borderTopWidth: 1, borderTopColor: theme.border }, pressed && styles.pressed]}>
                  <View style={[styles.quickIcon, phone && styles.quickIconPhone, { backgroundColor: theme.primarySoft }]}>
                    <HomeIcon name={item.href === '/secretariat' ? 'secretariat' : 'partners'} size={27} color={theme.primary} />
                  </View>
                  <View style={styles.quickCopy}>
                    <ThemedText type="smallBold" style={[styles.quickTitle, phone && styles.quickTitlePhone]}>{item.title}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={phone && styles.quickDetailPhone}>{item.detail}</ThemedText>
                  </View>
                </Pressable>
              ))}
            </View>
            {ecgError ? <ThemedText accessibilityRole="alert" type="small" style={{ color: theme.danger }}>{ecgError}</ThemedText> : null}
          </View>

        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  bodyPhone: { fontSize: 14, lineHeight: 21 },
  quickDetailPhone: { fontSize: 13, lineHeight: 19 },
  sectionTitlePhone: { fontSize: 21, lineHeight: 28 },
  updateTitlePhone: { fontSize: 19, lineHeight: 25 },
  essentialsTitlePhone: { fontSize: 22, lineHeight: 29 },
  phoneContent: { paddingHorizontal: 16, gap: 18 },
  mastheadLogoPhone: { width: 40, height: 40 },
  heroCopyPhone: { padding: 18 },
  scheduleCardPhone: { minHeight: 0, paddingHorizontal: 18, paddingVertical: 20 },
  eventTitlePhone: { fontSize: 21, lineHeight: 27 },
  coffeeCardPhone: { padding: 16, gap: 12 },
  coffeeIconPhone: { width: 40, height: 40, borderRadius: 14 },
  coffeeTitlePhone: { fontSize: 18, lineHeight: 24 },
  quickTilePhone: { padding: 16, gap: 14, minHeight: 164 },
  quickIconPhone: { width: 40, height: 40, borderRadius: 14 },
  quickTitlePhone: { fontSize: 15, lineHeight: 20 },
  root: { flex: 1 },
  safeArea: { flex: 1 },
  content: { alignSelf: 'center', gap: Spacing.five, maxWidth: MaxContentWidth, paddingBottom: Math.max(BottomTabInset, 80) + Spacing.five, paddingHorizontal: 20, paddingTop: Spacing.two, width: '100%' },
  masthead: { alignItems: 'center', flexDirection: 'row', gap: Spacing.twoAndHalf, minHeight: 64 },
  mastheadLogo: { height: 52, width: 52 },
  mastheadCopy: { flex: 1, gap: 1, minWidth: 0 },
  mastheadTitle: { fontSize: 17, letterSpacing: 0.8 },
  dateBadge: { maxWidth: '100%', flexShrink: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.twoAndHalf, paddingVertical: Spacing.two },
  hero: { backgroundColor: Brand.black, borderRadius: Radius.feature, height: 244, justifyContent: 'flex-end', overflow: 'hidden', width: '100%' },
  heroCompact: { height: undefined, minHeight: 180 },
  heroArt: { ...StyleSheet.absoluteFill, height: '100%', width: '100%' },
  heroCopy: { gap: Spacing.two, maxWidth: 520, padding: Spacing.four },
  heroEyebrow: { color: Brand.gold, fontSize: 12, letterSpacing: 1.8 },
  heroTitle: { color: Brand.white, fontSize: 34, fontWeight: '500', lineHeight: 39 },
  heroTitleCompact: { fontSize: 22, lineHeight: 28 },
  eyebrow: { fontSize: 12, letterSpacing: 1.5 },
  scheduleCard: { backgroundColor: Brand.parchment, borderColor: Brand.goldDark, borderRadius: Radius.feature, borderWidth: 2, minHeight: 280, paddingHorizontal: Spacing.four, paddingVertical: Spacing.five },
  scheduleTopline: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, justifyContent: 'space-between' },
  scheduleLabelRow: { alignItems: 'center', backgroundColor: Brand.gold, borderRadius: Radius.pill, flexDirection: 'row', minHeight: 32, paddingHorizontal: Spacing.twoAndHalf, paddingVertical: 6 },
  scheduleEyebrow: { color: Brand.black, fontSize: 12, letterSpacing: 1.5 },
  eventTitle: { fontSize: 28, fontWeight: '500', lineHeight: 36, marginTop: Spacing.three },
  eventDetail: { fontSize: 16, fontWeight: '400', lineHeight: 24, marginTop: Spacing.two },
  scheduleAction: { alignItems: 'center', alignSelf: 'stretch', marginTop: Spacing.four, backgroundColor: Brand.gold, borderRadius: Radius.control, justifyContent: 'center', minHeight: 52, paddingHorizontal: Spacing.three },
  scheduleActionText: { color: Brand.black },
  section: { gap: Spacing.three },
  sectionHeading: { marginBottom: Spacing.two, alignItems: 'flex-end', flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, justifyContent: 'space-between' },
  sectionTitle: { fontSize: 24, lineHeight: 30, marginTop: 2 },
  updateCard: { borderLeftWidth: 5, borderRadius: Radius.card, borderWidth: 1, minHeight: 156, padding: 20 },
  updateAction: { borderTopWidth: 1, marginTop: Spacing.four, paddingTop: Spacing.three },
  statusBadge: { borderRadius: Radius.pill, paddingHorizontal: Spacing.twoAndHalf, paddingVertical: 6 },
  updateTitle: { fontSize: 21, lineHeight: 27, marginBottom: Spacing.two },
  essentialsHeading: { gap: 6, marginBottom: 4 },
  essentialsTitle: { fontSize: 26, lineHeight: 34, fontWeight: '600' },
  conferenceLabel: { fontSize: 12, lineHeight: 18, letterSpacing: 0.8, marginTop: 4 },
  conferenceList: { borderWidth: 1, borderRadius: 22, overflow: 'hidden' },
  conferenceRow: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, minHeight: 96 },
  coffeeCard: { borderWidth: 1, borderRadius: Radius.feature, padding: Spacing.four, gap: Spacing.three },
  coffeeTopline: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.three },
  coffeeToplineCompact: { alignItems: 'flex-start' },
  coffeeCopy: { flex: 1, minWidth: 140, gap: Spacing.two },
  coffeeIcon: { backgroundColor: Brand.parchment, width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  setupBadge: { backgroundColor: Brand.parchment, borderRadius: Radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  coffeeTitle: { color: Brand.black, fontSize: 20, lineHeight: 26 },
  coffeeDescription: { color: Brand.black, fontSize: 16, lineHeight: 24 },
  coffeeButton: { backgroundColor: Brand.pine, flexDirection: 'row', gap: Spacing.twoAndHalf, minHeight: 52, borderRadius: 16, padding: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  coffeeButtonText: { color: Brand.white, textAlign: 'center' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'stretch' },
  quickTile: { width: '47%', flexGrow: 1, flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, minHeight: 190, padding: 20, borderRadius: 22, borderWidth: 1, gap: 20 },
  quickTileStacked: { width: '100%', flexDirection: 'row', alignItems: 'center', minHeight: 100 },
  quickIcon: { alignItems: 'center', borderRadius: 18, height: 56, flexShrink: 0, justifyContent: 'center', width: 56 },
  quickCopy: { flex: 1, minWidth: 0, gap: Spacing.two },
  quickTitle: { fontSize: 18, lineHeight: 24 },
  pressed: { opacity: 0.76 },
});
