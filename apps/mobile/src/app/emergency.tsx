import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, MaxContentWidth, Spacing } from '@/constants/theme';
import { useConferenceContent } from '@/contexts/conference-content';
import { useTheme } from '@/hooks/use-theme';
import { phoneCallUrl, whatsappChatUrl } from '@/lib/contact-links';

const roles = ['Secretary General', 'Deputy Secretary General', 'USG Safety and Security'] as const;
const services = [
  { name: 'Fire & ambulance', number: '112' },
  { name: 'Police', number: '110' },
];

export default function EmergencyScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { content, isLoading } = useConferenceContent();
  const [linkError, setLinkError] = useState('');
  const contacts = content?.emergencyContacts ?? [];
  const roleContacts = roles.map((role) => ({
    role,
    contact: contacts.find((item) => item.role === role || item.label === role),
  }));

  async function openLink(url: string) {
    setLinkError('');
    try {
      await Linking.openURL(url);
    } catch {
      setLinkError('This contact link could not be opened. Please use the number shown on the page.');
    }
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerInner}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={goBack} style={styles.backButton}>
            <ThemedText style={styles.backArrow}>←</ThemedText>
          </Pressable>
          <ThemedText type="subtitle" style={styles.headerTitle}>Emergency contacts</ThemedText>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <ThemedText type="smallBold" style={[styles.sectionLabel, { color: theme.primary }]}>EMERGENCY SERVICES</ThemedText>
          <View style={[styles.serviceCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            {services.map((service, index) => (
              <View key={service.number}>
                {index > 0 ? <View style={[styles.divider, { backgroundColor: theme.border }]} /> : null}
                <Pressable accessibilityRole="link" accessibilityLabel={`Call ${service.name} at ${service.number}`}
                  onPress={() => void openLink(`tel:${service.number}`)} style={({ pressed }) => [styles.serviceRow, pressed && styles.pressed]}>
                  <ThemedText type="smallBold" style={styles.serviceName}>{service.name}</ThemedText>
                  <View style={styles.serviceAction}>
                    <ThemedText style={[styles.serviceNumber, { color: theme.primary }]}>{service.number}</ThemedText>
                    <ThemedText type="smallBold" style={[styles.callHint, { color: theme.primary }]}>Call →</ThemedText>
                  </View>
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="smallBold" style={[styles.sectionLabel, { color: theme.primary }]}>KAMUN STAFF</ThemedText>
          <View style={styles.staffList}>
            {roleContacts.map(({ role, contact }) => {
              const callUrl = phoneCallUrl(contact?.phone ?? null);
              const whatsappUrl = whatsappChatUrl(contact?.phone ?? null);
              return (
                <View key={role} style={[styles.staffCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                  <View style={styles.staffIdentity}>
                    <ThemedText type="smallBold" style={styles.staffName}>{contact?.personName ?? role}</ThemedText>
                    {contact?.personName ? <ThemedText type="small" themeColor="textSecondary">{role}</ThemedText> : null}
                    {contact?.phone ? <ThemedText type="small" themeColor="textSecondary">{contact.phone}</ThemedText> : null}
                  </View>
                  {callUrl ? (
                    <View style={styles.staffActions}>
                      <Pressable accessibilityRole="link" accessibilityLabel={`Call ${role}`} onPress={() => void openLink(callUrl)}
                        style={({ pressed }) => [styles.actionButton, { backgroundColor: Brand.pine }, pressed && styles.pressed]}>
                        <ThemedText type="smallBold" style={styles.callButtonText}>Call</ThemedText>
                      </Pressable>
                      {whatsappUrl ? (
                        <Pressable accessibilityRole="link" accessibilityLabel={`Chat with ${role} on WhatsApp`} onPress={() => void openLink(whatsappUrl)}
                          style={({ pressed }) => [styles.actionButton, { borderColor: theme.primary, borderWidth: 1 }, pressed && styles.pressed]}>
                          <ThemedText type="smallBold" style={{ color: theme.primary }}>WhatsApp</ThemedText>
                        </Pressable>
                      ) : null}
                    </View>
                  ) : (
                    <ThemedText type="small" themeColor="textSecondary">{isLoading ? 'Loading…' : 'Contact coming soon'}</ThemedText>
                  )}
                </View>
              );
            })}
          </View>
        </View>
        {linkError ? <ThemedText type="small" themeColor="danger" accessibilityRole="alert">{linkError}</ThemedText> : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { backgroundColor: Brand.pine },
  headerInner: { alignItems: 'center', alignSelf: 'center', flexDirection: 'row', maxWidth: MaxContentWidth, minHeight: 72, paddingHorizontal: Spacing.three, width: '100%' },
  backButton: { alignItems: 'center', justifyContent: 'center', minHeight: 48, minWidth: 48 },
  backArrow: { color: Brand.cream, fontSize: 30, lineHeight: 36 },
  headerTitle: { color: Brand.cream, flex: 1, fontSize: 24, lineHeight: 29, marginLeft: Spacing.two },
  scroll: { alignSelf: 'center', gap: Spacing.four, maxWidth: MaxContentWidth, paddingBottom: BottomTabInset + Spacing.five, paddingHorizontal: Spacing.three, paddingTop: Spacing.four, width: '100%' },
  section: { gap: 12 },
  sectionLabel: { fontSize: 12, letterSpacing: 1.8 },
  serviceCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', paddingHorizontal: 18 },
  divider: { height: 1 },
  serviceRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 76, paddingVertical: 12 },
  serviceName: { flex: 1, fontSize: 17, lineHeight: 22, paddingRight: Spacing.two },
  serviceAction: { alignItems: 'flex-end', gap: 1 },
  serviceNumber: { fontSize: 22, fontWeight: '800', lineHeight: 26 },
  callHint: { fontSize: 12 },
  staffList: { gap: 12 },
  staffCard: { borderRadius: 18, borderWidth: 1, gap: Spacing.three, padding: 18 },
  staffIdentity: { gap: 3 },
  staffName: { fontSize: 18, lineHeight: 24 },
  staffActions: { flexDirection: 'row', gap: 10 },
  actionButton: { alignItems: 'center', borderRadius: 11, flex: 1, justifyContent: 'center', minHeight: 48, minWidth: 0, paddingHorizontal: Spacing.two },
  callButtonText: { color: Brand.white },
  pressed: { opacity: 0.72 },
});
