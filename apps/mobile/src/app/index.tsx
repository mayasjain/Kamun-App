import { useEffect, useState } from 'react';
import { Link, useRouter, type Href } from 'expo-router';
import { AppState, Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, MaxContentWidth } from '@/constants/theme';
import { useConferenceContent } from '@/contexts/conference-content';
import { useTheme } from '@/hooks/use-theme';
import { formatEventTime } from '@/lib/date-format';

type QuickLink = { title: string; detail: string; href: Href; symbol: string; urgent?: boolean };

const quickLinks: QuickLink[] = [
  { title: 'Emergency', detail: 'Help and contacts', href: '/emergency', symbol: '!', urgent: true },
  { title: 'Gossip box', detail: 'Send a message', href: '/gossip', symbol: '✉' },
];

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 375 || fontScale > 1.2;
  const [now, setNow] = useState(Date.now);
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
  const announcementAccent = announcement?.priority === 'urgent' ? theme.danger : theme.primary;

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Image accessibilityLabel="KAMUN crest" resizeMode="contain" source={require('../../assets/branding/kamun-logo-v2.png')} style={styles.headerLogo} />
            <View style={styles.headerCopy}>
              <ThemedText style={styles.headerTitle}>KAMUN 2026</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Black Forest Summit · Karlsruhe</ThemedText>
            </View>
          </View>

          <View accessible accessibilityLabel="KAMUN 2026 banner showing Karlsruhe Palace and the Black Forest" style={[styles.banner, compact && styles.bannerCompact]}>
            <Image source={require('../../assets/branding/kamun-banner.png')} resizeMode="cover" style={styles.bannerArt} accessible={false} />
            <Image source={require('../../assets/branding/kamun-logo-v2.png')} resizeMode="contain" style={[styles.bannerLogo, compact && styles.bannerLogoCompact]} accessible={false} />
          </View>

          <View style={styles.welcomeRow}>
            <View>
              <ThemedText type="smallBold" style={[styles.eyebrow, { color: theme.primary }]}>13–15 NOVEMBER · KARLSRUHE</ThemedText>
              <ThemedText style={styles.welcomeTitle}>Your conference, at a glance.</ThemedText>
            </View>
          </View>

          <Link href="/schedule" asChild>
            <Pressable accessibilityRole="link" accessibilityLabel={nextEvent ? `Next event: ${nextEvent.title}. Open schedule` : 'Open conference schedule'} style={({ pressed }) => [styles.featureCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, pressed && styles.pressed]}>
              <View style={styles.cardTopline}>
                <ThemedText type="smallBold" style={[styles.eyebrow, { color: theme.primary }]}>UP NEXT</ThemedText>
                <ThemedText type="smallBold" style={{ color: theme.primary }}>Schedule →</ThemedText>
              </View>
              <ThemedText style={styles.eventTitle}>{nextEvent?.title ?? (isLoading ? 'Loading programme…' : 'No upcoming sessions')}</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.eventDetail}>
                {nextEvent ? `${formatEventTime(nextEvent.startsAt, nextEvent.endsAt)}${nextEvent.roomName ? ` · ${nextEvent.roomName}` : ''}` : 'See the full conference programme.'}
              </ThemedText>
            </Pressable>
          </Link>

          <View style={styles.section}>
            <View style={styles.sectionHeading}>
              <ThemedText type="smallBold" style={[styles.eyebrow, { color: theme.primary }]}>LATEST UPDATE</ThemedText>
              <Link href="/updates" asChild><Pressable accessibilityRole="link" hitSlop={8}><ThemedText type="smallBold" style={{ color: theme.primary }}>All updates →</ThemedText></Pressable></Link>
            </View>
            <Link href="/updates" asChild>
              <Pressable accessibilityRole="link" accessibilityLabel={`View updates. ${announcement?.title ?? 'No new announcement'}`} style={({ pressed }) => [styles.updateCard, { backgroundColor: theme.backgroundElement, borderColor: announcementAccent }, pressed && styles.pressed]}>
                {announcement?.priority === 'urgent' ? <ThemedText type="smallBold" style={{ color: theme.danger }}>URGENT</ThemedText> : null}
                <ThemedText type="smallBold" style={styles.updateTitle}>{announcement?.title ?? (isLoading ? 'Loading updates…' : 'No new announcements')}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>{announcement?.body ?? 'Organiser messages will appear here when published.'}</ThemedText>
              </Pressable>
            </Link>
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold" style={[styles.eyebrow, { color: theme.primary }]}>QUICK ACCESS</ThemedText>
            <View style={[styles.quickList, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
              {quickLinks.map((item, index) => (
                <Pressable key={item.title} onPress={() => router.push(item.href)} accessibilityRole="link" accessibilityLabel={`${item.title}, ${item.detail}`} style={({ pressed }) => [styles.quickRow, index > 0 && { borderTopWidth: 1, borderTopColor: theme.border }, pressed && styles.pressed]}>
                    <View style={[styles.quickIcon, { backgroundColor: item.urgent ? '#FBE8E5' : theme.primarySoft }]}>
                      <ThemedText style={[styles.quickSymbol, { color: item.urgent ? theme.danger : theme.primary }]}>{item.symbol}</ThemedText>
                    </View>
                    <View style={styles.quickCopy}>
                      <ThemedText type="smallBold" style={styles.quickTitle}>{item.title}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">{item.detail}</ThemedText>
                    </View>
                    <ThemedText style={[styles.quickArrow, { color: theme.primary }]}>→</ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          {source === 'cache' || error ? <ThemedText type="small" themeColor="textSecondary">{source === 'cache' ? 'Showing saved conference information.' : 'Live updates are temporarily unavailable.'}</ThemedText> : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  content: { alignSelf: 'center', gap: 22, maxWidth: MaxContentWidth, paddingBottom: Math.max(BottomTabInset, 80) + 34, paddingHorizontal: 20, paddingTop: 16, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', gap: 10, minHeight: 58 },
  headerLogo: { height: 52, width: 52 },
  headerCopy: { flex: 1, gap: 1 },
  headerTitle: { color: Brand.black, fontSize: 22, fontWeight: '800', letterSpacing: 0.2, lineHeight: 27 },
  banner: { backgroundColor: Brand.black, borderRadius: 22, height: 220, justifyContent: 'center', overflow: 'hidden', width: '100%' },
  bannerCompact: { height: 180 },
  bannerArt: { ...StyleSheet.absoluteFill, height: '100%', width: '100%' },
  bannerLogo: { height: 168, marginLeft: 24, width: 168 },
  bannerLogoCompact: { height: 132, marginLeft: 12, width: 132 },
  welcomeRow: { paddingTop: 2 },
  eyebrow: { fontSize: 11, letterSpacing: 1.7 },
  welcomeTitle: { color: Brand.black, fontSize: 27, fontWeight: '800', lineHeight: 33, marginTop: 5 },
  featureCard: { borderRadius: 20, borderWidth: 1, gap: 11, minHeight: 132, padding: 20 },
  cardTopline: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  eventTitle: { color: Brand.black, fontSize: 25, fontWeight: '800', lineHeight: 30 },
  eventDetail: { fontSize: 15, lineHeight: 21 },
  section: { gap: 11 },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  updateCard: { borderLeftWidth: 4, borderRadius: 17, gap: 7, minHeight: 92, padding: 17 },
  updateTitle: { fontSize: 17, lineHeight: 23 },
  quickList: { borderRadius: 18, borderWidth: 1, maxWidth: 680, overflow: 'hidden', width: '100%' },
  quickRow: { alignItems: 'center', flexDirection: 'row', gap: 13, minHeight: 76, paddingHorizontal: 16, paddingVertical: 12, width: '100%' },
  quickIcon: { alignItems: 'center', borderRadius: 12, height: 42, justifyContent: 'center', width: 42 },
  quickSymbol: { fontSize: 23, fontWeight: '600', lineHeight: 28 },
  quickCopy: { flex: 1, gap: 2 },
  quickTitle: { fontSize: 16 },
  quickArrow: { fontSize: 22, lineHeight: 28, marginLeft: 4 },
  pressed: { opacity: 0.72 },
});
