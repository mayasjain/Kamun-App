import { Link } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

const sections = [
  {
    title: 'Data on your device',
    body: 'The app saves a copy of public conference information on your device so you can view it offline. You can clear this copy in your browser or device settings.',
  },
  {
    title: 'Connected services',
    body: 'The app uses Supabase to load public conference information. External links, such as Instagram and LinkedIn, open services with their own privacy policies.',
  },
  {
    title: 'Records from the conference',
    body: 'The organising team may still hold records from features that were available during the conference, including attendee access and contributions. Contact the KAMUN organising team through its official contact channels with questions or requests about those records.',
  },
];

export default function PrivacyScreen() {
  const theme = useTheme();
  const phone = useWindowDimensions().width < 600;
  return (
    <Screen compactHeader eyebrow="KAMUN 2026" title="Privacy policy" subtitle="How the conference app uses information">
      <View style={[styles.article, phone && styles.articlePhone, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        {sections.map((section, index) => (
          <View key={section.title} style={[styles.section, index > 0 && [styles.divided, { borderTopColor: theme.border }]]}>
            <ThemedText accessibilityRole="header" style={[styles.sectionTitle, { color: theme.primary }]}>{section.title}</ThemedText>
            <ThemedText selectable themeColor="textSecondary" style={phone && styles.bodyPhone}>{section.body}</ThemedText>
          </View>
        ))}
      </View>
      <Link href="/coffee-privacy" asChild><Pressable accessibilityRole="link" style={styles.coffeeLink}><ThemedText type="small" themeColor="primary">Coffee-ordering privacy notice</ThemedText></Pressable></Link>
      <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>KAMUN 2026</ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  article: { borderRadius: 18, borderWidth: 1, padding: 24, gap: 24 },
  articlePhone: { padding: 16, gap: 20 },
  section: { gap: 10 },
  divided: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 20 },
  sectionTitle: { fontSize: 17, lineHeight: 24, fontWeight: '500' },
  bodyPhone: { fontSize: 14, lineHeight: 22 },
  coffeeLink: { minHeight: 48, justifyContent: 'center', paddingVertical: 8 },
  footer: { fontSize: 12, lineHeight: 18, textAlign: 'center', paddingVertical: 8 },
});
