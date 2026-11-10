import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

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
  const theme = useTheme();
  const phone = useWindowDimensions().width < 600;
  return (
    <Screen compactHeader eyebrow="KAMUN 2026" title="Privacy policy" subtitle="How your conference information is used">
      <View style={[styles.article, phone && styles.articlePhone, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.section}>
          <ThemedText accessibilityRole="header" style={[styles.introTitle, { color: theme.primary }]}>A little clarity on privacy</ThemedText>
          <ThemedText selectable themeColor="textSecondary" style={phone && styles.bodyPhone}>Here’s how the conference app uses information to keep your access, conference content and updates working.</ThemedText>
        </View>
        {sections.map(section => (
          <View key={section.title} style={[styles.section, styles.divided, { borderTopColor: theme.border }]}>
            <ThemedText accessibilityRole="header" style={[styles.sectionTitle, { color: theme.primary }]}>{section.title}</ThemedText>
            <ThemedText selectable themeColor="textSecondary" style={phone && styles.bodyPhone}>{section.body}</ThemedText>
          </View>
        ))}
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>KAMUN 2026 · Made for delegates</ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  article: { borderRadius: 18, borderWidth: 1, padding: 24, gap: 24 },
  articlePhone: { padding: 16, gap: 20 },
  section: { gap: 10 },
  divided: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 20 },
  introTitle: { fontSize: 20, lineHeight: 27, fontWeight: '500' },
  sectionTitle: { fontSize: 17, lineHeight: 24, fontWeight: '500' },
  bodyPhone: { fontSize: 14, lineHeight: 22 },
  footer: { fontSize: 12, lineHeight: 18, textAlign: 'center', paddingVertical: 8 },
});
