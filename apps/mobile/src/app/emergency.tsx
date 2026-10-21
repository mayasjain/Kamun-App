import { Link } from 'expo-router';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useConferenceContent } from '@/contexts/conference-content';
import { useTheme } from '@/hooks/use-theme';
import { whatsappChatUrl } from '@/lib/contact-links';

const roles = ['Secretary General', 'Deputy Secretary General', 'USG Safety and Security'] as const;
const services = [
  { name: 'Fire & ambulance', description: 'Life-threatening emergencies', number: '112' },
  { name: 'Police', description: 'Emergency police assistance', number: '110' },
];

export default function EmergencyScreen() {
  const theme = useTheme();
  const { content, isLoading } = useConferenceContent();
  const [linkError, setLinkError] = useState('');
  const contacts = content?.emergencyContacts ?? [];
  const roleContacts = roles.map((role) => ({
    role,
    contact: contacts.find((item) => item.role === role || item.label === role),
  }));
  const availableNumbers = roleContacts.map(({ contact }) => contact?.phone).filter((phone): phone is string => Boolean(phone));
  const sameNumberForAll = availableNumbers.length === roles.length && new Set(availableNumbers).size === 1;
  const safetyUrl = whatsappChatUrl(roleContacts[2].contact?.phone ?? null);

  async function openLink(url: string) {
    setLinkError('');
    try {
      await Linking.openURL(url);
    } catch {
      setLinkError('The contact link could not be opened on this device.');
    }
  }

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerInner}>
          <Link href="/more" asChild>
            <Pressable accessibilityRole="link" accessibilityLabel="Back to More" style={styles.backButton}>
              <ThemedText style={styles.backArrow}>←</ThemedText>
            </Pressable>
          </Link>
          <ThemedText type="subtitle" style={styles.headerTitle}>Emergency</ThemedText>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.safetyCard}>
          <ThemedText type="subtitle" style={styles.safetyTitle}>KAMUN is a safe and inclusive space</ThemedText>
          <ThemedText style={styles.safetyBody}>
            If you feel unsafe or need support during the conference, contact the KAMUN team. For immediate danger, call emergency services below.
          </ThemedText>
          {safetyUrl ? (
            <Pressable accessibilityRole="link" accessibilityLabel="Chat with USG Safety and Security on WhatsApp"
              onPress={() => void openLink(safetyUrl)} style={styles.safetyButton}>
              <ThemedText type="smallBold" style={styles.safetyButtonText}>Contact Safety & Security on WhatsApp →</ThemedText>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.section}>
          <ThemedText type="smallBold" style={[styles.sectionLabel, { color: theme.primary }]}>EMERGENCY SERVICES</ThemedText>
          <View style={[styles.groupCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            {services.map((service, index) => (
              <View key={service.number}>
                {index > 0 ? <View style={[styles.divider, { backgroundColor: theme.border }]} /> : null}
                <Pressable accessibilityRole="link" accessibilityLabel={`Call ${service.name} at ${service.number}`}
                  onPress={() => void openLink(`tel:${service.number}`)} style={styles.serviceRow}>
                  <View style={styles.rowCopy}>
                    <ThemedText type="smallBold" style={styles.rowTitle}>{service.name}</ThemedText>
                    <ThemedText style={styles.rowDetail} themeColor="textSecondary">{service.description}</ThemedText>
                  </View>
                  <ThemedText type="smallBold" style={[styles.serviceNumber, { color: theme.primary }]}>{service.number}</ThemedText>
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="smallBold" style={[styles.sectionLabel, { color: theme.primary }]}>KAMUN STAFF CONTACTS</ThemedText>
          <View style={[styles.groupCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            {roleContacts.map(({ role, contact }, index) => {
              const url = whatsappChatUrl(contact?.phone ?? null);
              return (
                <View key={role}>
                  {index > 0 ? <View style={[styles.divider, { backgroundColor: theme.border }]} /> : null}
                  <View style={styles.staffRow}>
                    <View style={styles.rowCopy}>
                      <ThemedText type="smallBold" style={styles.rowTitle}>{contact?.personName ?? role}</ThemedText>
                      {contact?.personName ? <ThemedText style={styles.rowDetail} themeColor="textSecondary">{role}</ThemedText> : null}
                    </View>
                    {url ? (
                      <Pressable accessibilityRole="link" accessibilityLabel={`Open WhatsApp chat with ${role}`}
                        onPress={() => void openLink(url)} style={styles.whatsappLink}>
                        <ThemedText type="smallBold" style={[styles.contactNumber, { color: theme.primary }]}>{contact?.phone}</ThemedText>
                        <ThemedText type="smallBold" style={styles.whatsappLabel}>WhatsApp →</ThemedText>
                      </Pressable>
                    ) : (
                      <ThemedText type="small" themeColor="textSecondary" style={styles.pending}>
                        {isLoading ? 'Loading…' : 'Number coming soon'}
                      </ThemedText>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
          {sameNumberForAll ? (
            <ThemedText type="small" themeColor="textSecondary">These three roles currently use the same WhatsApp number.</ThemedText>
          ) : null}
        </View>
        {linkError ? <ThemedText type="small" themeColor="danger">{linkError}</ThemedText> : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { backgroundColor: Brand.pine },
  headerInner: { alignItems: 'center', alignSelf: 'center', flexDirection: 'row', maxWidth: MaxContentWidth, minHeight: 86, paddingHorizontal: Spacing.three, width: '100%' },
  backButton: { alignItems: 'center', justifyContent: 'center', minHeight: 48, minWidth: 48 },
  backArrow: { color: Brand.cream, fontSize: 32, lineHeight: 38 },
  headerTitle: { color: Brand.cream, fontSize: 27, marginLeft: Spacing.two },
  scroll: { alignSelf: 'center', gap: Spacing.five, maxWidth: MaxContentWidth, paddingBottom: BottomTabInset + Spacing.five, paddingHorizontal: Spacing.three, paddingTop: Spacing.four, width: '100%' },
  safetyCard: { backgroundColor: Brand.black, borderRadius: 22, gap: Spacing.three, padding: Spacing.four },
  safetyTitle: { color: Brand.cream, fontSize: 21, lineHeight: 28 },
  safetyBody: { color: '#D5DFD5', fontFamily: Fonts.serif, fontSize: 17, fontStyle: 'italic', lineHeight: 25 },
  safetyButton: { alignItems: 'center', backgroundColor: Brand.pine, borderRadius: 12, justifyContent: 'center', minHeight: 48, paddingHorizontal: Spacing.three },
  safetyButtonText: { color: Brand.cream, textAlign: 'center' },
  section: { gap: Spacing.three },
  sectionLabel: { fontSize: 12, letterSpacing: 2.4 },
  groupCard: { borderRadius: 22, borderWidth: 1, overflow: 'hidden', paddingHorizontal: Spacing.three },
  divider: { height: 1 },
  serviceRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 90, paddingVertical: Spacing.three },
  staffRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 92, paddingVertical: Spacing.three },
  rowCopy: { flex: 1, gap: 3, paddingRight: Spacing.two },
  rowTitle: { fontSize: 17, lineHeight: 23 },
  rowDetail: { fontFamily: Fonts.serif, fontSize: 15, fontStyle: 'italic', lineHeight: 20 },
  serviceNumber: { fontSize: 20 },
  whatsappLink: { alignItems: 'flex-end', gap: 4, justifyContent: 'center', minHeight: 48 },
  contactNumber: { fontSize: 15, textAlign: 'right' },
  whatsappLabel: { color: '#168A4E', fontSize: 13 },
  pending: { flexShrink: 1, maxWidth: 120, textAlign: 'right' },
});
