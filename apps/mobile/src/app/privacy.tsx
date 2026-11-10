import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, Fonts, MaxContentWidth } from '@/constants/theme';

const sections = [
  {
    title: 'What the app stores',
    body: 'Your conference access is linked to a committee, seat and role. The app remembers this identity and your sign-in session on this device so you can return without entering your code each time. Conference access and permissions are checked with the server.',
  },
  {
    title: 'What you share',
    body: 'If you upload a meme, post gossip, leave a comment, vote or report content, the app stores that contribution and the information needed to manage it. Posts and comments may be visible to other attendees in the relevant conference or committee. Avoid sharing personal or sensitive information about yourself or others.',
  },
  {
    title: 'Notifications',
    body: 'If you enable web push notifications, the app stores a push subscription linked to your conference access so it can send relevant updates. You can turn notifications off in your browser or device settings.',
  },
  {
    title: 'On your device',
    body: 'The app keeps your conference identity, session information and some cached content on your device. Signing out clears your remembered conference identity. If you use a shared device, sign out when you finish.',
  },
  {
    title: 'Who can see it',
    body: 'Attendees can see content shared with their audience. Authorised organisers and administrators can manage conference information and moderate contributions. Access is controlled by your conference role and committee.',
  },
  {
    title: 'Connected services',
    body: 'The conference app uses Supabase for sign-in, data and uploaded content. Coffee ordering opens the separate ECE service, which has its own privacy information. External links, including Instagram and the feedback survey, open services with their own privacy policies.',
  },
  {
    title: 'Questions and deletion requests',
    body: 'Contact the KAMUN organising team through the conference’s official contact channels with questions about your information, access or deletion. Signing out removes your remembered identity from this device; it does not delete contributions already stored by the conference.',
  },
];

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ paddingBottom: BottomTabInset + insets.bottom + 32 }}>
        <View style={styles.hero}>
          <View style={styles.headerContent}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back to More" onPress={() => router.replace('/more')} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
              <Text style={styles.backText}>← More</Text>
            </Pressable>
            <Text accessibilityRole="header" style={styles.title}>Privacy Policy</Text>
            <Text style={styles.subtitle}>Your conference. Your information.</Text>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.intro}>
            <Text style={styles.eyebrow}>KAMUN 2026</Text>
            <Text style={styles.introTitle}>A little clarity on privacy</Text>
            <Text style={styles.body}>Here’s how the conference app uses information to keep your access, conference content and updates working.</Text>
          </View>
          {sections.map(section => (
            <View key={section.title} style={styles.section}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>{section.title}</Text>
              <Text selectable style={styles.body}>{section.body}</Text>
            </View>
          ))}
          <Text style={styles.footer}>KAMUN 2026 · Made for delegates</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2E8D2' },
  hero: { backgroundColor: '#567596' },
  headerContent: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: 24, paddingBottom: 28, paddingTop: 8, gap: 8 },
  back: { minHeight: 48, alignSelf: 'flex-start', justifyContent: 'center', paddingRight: 20 },
  backText: { color: '#FFF8E9', fontSize: 16 },
  pressed: { opacity: 0.65 },
  title: { color: '#FFF8E9', fontSize: 32, lineHeight: 40, fontWeight: '700' },
  subtitle: { color: '#FFF8E9', fontFamily: Fonts.serif, fontStyle: 'italic', fontSize: 18, lineHeight: 27 },
  content: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', padding: 20, gap: 28 },
  intro: { backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: '#DFE5EB', padding: 24, gap: 12 },
  eyebrow: { color: '#405F80', fontSize: 12, lineHeight: 18, letterSpacing: 2, fontWeight: '700' },
  introTitle: { color: '#202A34', fontSize: 22, lineHeight: 30, fontWeight: '600' },
  section: { gap: 10, paddingHorizontal: 4 },
  sectionTitle: { color: '#405F80', fontSize: 16, lineHeight: 24, letterSpacing: 0.5, fontWeight: '700' },
  body: { color: '#41464B', fontSize: 16, lineHeight: 26 },
  footer: { color: '#405F80', fontSize: 12, lineHeight: 20, textAlign: 'center', paddingVertical: 12 },
});
