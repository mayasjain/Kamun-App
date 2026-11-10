import { Link } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

// Adapted from ECE's published participant notice and the current KAMUN integration.
const sections = [
  { title: 'Your conference identity', body: 'Coffee ordering uses your existing KAMUN access. ECE identifies a delegation by its committee and seat, or an individual chair account. Its application records do not contain delegates’ names, email addresses, dates of birth or postal addresses. Chairs’ names, as listed on mymun, are stored and shown on the barista’s board so staff know whose drink to prepare.' },
  { title: 'Access codes and sessions', body: 'ECE keeps a scrambled value of your access code for verification and an encrypted copy so Logistics can resend it. ECE also records when an account was last used. KAMUN remembers your sign-in session and conference identity on this device. Coffee requests are verified through a private server connection; ordering inside KAMUN does not create an additional ECE browser cookie. The separate ECE website uses its own necessary login cookie, which expires at the organisers’ configured login deadline.' },
  { title: 'Your orders and payments', body: 'ECE stores the drink, selected options, your note, order code, times, status and delivery or pickup details, including the committee, seat and room needed for fulfilment. When charging is enabled, it also stores the confirmed price, account balance and recorded payments. Payment is cash only at the conference counter; this app does not collect card details. Please keep sensitive personal information out of drink notes.' },
  { title: 'Who can see coffee information', body: 'Authorised bar staff and runners see the open orders and location information needed to prepare and deliver drinks or hand them over for pickup. The KAMUN Logistics team manages the account and order records. Payment staff use the balance and payment information needed at the counter. Coffee orders are not a public feed and are not shown to other delegates.' },
  { title: 'Security and activity records', body: 'ECE keeps short-lived counters of failed login attempts to protect access codes and staff passwords. These counters use scrambled network values rather than readable network addresses in the application database. It also records staff actions, such as marking an order ready, without staff names. Ordering limits are checked against the account’s orders. Coffee ordering adds no advertising, analytics or tracking features.' },
  { title: 'On your phone', body: 'The Coffee Bar holds its current order information and any unresolved order draft in memory. It does not save these in the installed app’s offline file cache or device storage. Closing or reloading the app discards the draft and the next visit fetches actual orders from ECE. Installing KAMUN keeps app files on your phone so it can open faster; it does not make coffee ordering available offline. Signing out clears the remembered conference identity on this device, but does not delete orders on the server.' },
  { title: 'Ready alerts', body: 'Ready banners appear inside the Coffee Bar. When a drink becomes ready while this screen is active, the app also attempts a short vibration on supported devices. The banner remains available when vibration is unsupported or disabled. These are in-app alerts, not push notifications for a closed app, and they do not create a separate notification subscription.' },
  { title: 'Where coffee information is kept', body: 'ECE runs on Cloudflare. Its published privacy notice states that its database is located in Western Europe. KAMUN uses Supabase for its conference sign-in and the server connection to ECE. The rest of KAMUN’s data handling is described in the main app privacy policy.' },
  { title: 'When coffee information is deleted', body: 'The organisers’ published ECE notice schedules deletion of coffee participant records and databases within a week after the conference, by 22 November 2026. Only anonymous totals, such as the number of drinks made, are retained. This coffee-specific retention policy does not state a deletion deadline for unrelated KAMUN app content or records.' },
  { title: 'Questions and requests', body: 'ECE is operated by the organiser of KAMUN 2026. For questions about coffee data or requests concerning it, contact the organising team. The official contact details and data-protection information are linked below.' },
];

export default function CoffeePrivacyScreen() {
  const theme = useTheme();
  const phone = useWindowDimensions().width < 600;
  return <Screen compactHeader eyebrow="KAMUN 2026" title="Coffee privacy" subtitle="How ECE handles your coffee-order information">
    <View style={[styles.article, phone && styles.articlePhone, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <ThemedText selectable themeColor="textSecondary" style={phone && styles.bodyPhone}>Coffee ordering happens inside KAMUN and is processed by ECE, the conference coffee service. This notice brings ECE’s participant information into the app and explains the connection between the two services.</ThemedText>
      {sections.map(section => <View key={section.title} style={[styles.section, { borderTopColor: theme.border }]}>
        <ThemedText accessibilityRole="header" style={[styles.sectionTitle, { color: theme.primary }]}>{section.title}</ThemedText>
        <ThemedText selectable themeColor="textSecondary" style={phone && styles.bodyPhone}>{section.body}</ThemedText>
      </View>)}
      <View style={styles.links}>
        <Link href="mailto:vorstand@munika.org" asChild><Pressable accessibilityRole="link" style={styles.link}><ThemedText type="small" themeColor="primary">Email the organisers · vorstand@munika.org</ThemedText></Pressable></Link>
        <Link href="https://kamun.org/impressum" target="_blank" rel="noopener noreferrer" asChild><Pressable accessibilityRole="link" accessibilityLabel="KAMUN Impressum, opens in your browser" style={styles.link}><ThemedText type="small" themeColor="primary">Official organiser and contact details</ThemedText></Pressable></Link>
        <Link href="https://kamun.org/datenSchutz" target="_blank" rel="noopener noreferrer" asChild><Pressable accessibilityRole="link" accessibilityLabel="KAMUN data protection information, opens in your browser" style={styles.link}><ThemedText type="small" themeColor="primary">Organisers’ data-protection information</ThemedText></Pressable></Link>
        <Link href="/privacy" asChild><Pressable accessibilityRole="link" style={styles.link}><ThemedText type="small" themeColor="primary">KAMUN app privacy policy</ThemedText></Pressable></Link>
        <Link href="/coffee" asChild><Pressable accessibilityRole="link" style={styles.link}><ThemedText type="small" themeColor="primary">Back to Coffee Bar</ThemedText></Pressable></Link>
      </View>
    </View>
  </Screen>;
}
const styles = StyleSheet.create({
  article: { borderRadius: 18, borderWidth: 1, padding: 24, gap: 24 },
  articlePhone: { padding: 16, gap: 20 },
  section: { gap: 10, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 20 },
  sectionTitle: { fontSize: 17, lineHeight: 24, fontWeight: '500' },
  bodyPhone: { fontSize: 14, lineHeight: 22 },
  links: { gap: 4 },
  link: { minHeight: 48, justifyContent: 'center', paddingVertical: 8 },
});
