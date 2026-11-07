import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, MaxContentWidth, Spacing } from '@/constants/theme';
import { useConferenceContent } from '@/contexts/conference-content';
import { useTheme } from '@/hooks/use-theme';
import { phoneCallUrl, whatsappChatUrl } from '@/lib/contact-links';

const services = [
  { name: 'Fire & ambulance', number: '112' },
  { name: 'Police', number: '110' },
];

export default function EmergencyScreen() {
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 380 || fontScale > 1.3;
  const theme = useTheme();
  const { content, isLoading, error, refresh } = useConferenceContent();
  const [linkError, setLinkError] = useState('');
  const contacts = content?.emergencyContacts ?? [];

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

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => void refresh()} tintColor={theme.primary} />}>
        <View style={styles.safetyBanner}>
          <ThemedText style={styles.safetyTitle}>KAMUN is a safe and inclusive space</ThemedText>
          <ThemedText style={styles.safetyCopy}>If you feel unsafe, uncomfortable or overwhelmed, reach out to the Secretariat or our Safety and Awareness team.</ThemedText>
          <View style={styles.codeWordBanner}>
            <ThemedText type="smallBold" style={styles.codeWordLabel}>SAFETY CODE WORD</ThemedText>
            <ThemedText accessibilityRole="header" style={styles.codeWord}>Angel Shot</ThemedText>
            <ThemedText style={styles.codeWordDescription}>Use this code word to ask for support for yourself or someone else, during the conference or at the socials.</ThemedText>
          </View>
        </View>
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
          <ThemedText type="smallBold" style={[styles.sectionLabel, { color: theme.primary }]}>STAFF CONTACTS</ThemedText>
          <View style={[styles.staffList, { backgroundColor: theme.backgroundElement }]}>
            {contacts.map((contact, index) => {
              const name = contact.personName ?? contact.label;
              const callUrl = phoneCallUrl(contact.phone);
              const whatsappUrl = whatsappChatUrl(contact.phone);
              return (
                <View key={contact.id} style={[styles.staffCard, stacked && styles.staffCardStacked, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border }]}>
                  <View style={styles.staffIdentity}>
                    <ThemedText type="smallBold" style={styles.staffName}>{name}</ThemedText>
                    {contact.role ? <ThemedText style={styles.staffRole} themeColor="textSecondary">{contact.role}</ThemedText> : null}
                  </View>
                  {callUrl ? (
                    <View style={[styles.staffActions, stacked && styles.staffActionsStacked]}>
                      <Pressable accessibilityRole="link" accessibilityLabel={`Call ${name}`} onPress={() => void openLink(callUrl)}
                        style={({ pressed }) => [styles.contactLink, pressed && styles.pressed]}>
                        <ThemedText type="smallBold" style={[styles.phoneNumber, { color: theme.primary }]}>{contact.phone}</ThemedText>
                      </Pressable>
                      {whatsappUrl ? (
                        <Pressable accessibilityRole="link" accessibilityLabel={`Chat with ${name} on WhatsApp`} onPress={() => void openLink(whatsappUrl)}
                          style={({ pressed }) => [styles.contactLink, styles.whatsappLink, pressed && styles.pressed]}>
                          <Image source={require('../../assets/branding/whatsapp.png')} style={styles.whatsappLogo} resizeMode="contain" accessible={false} />
                          <ThemedText type="smallBold" style={{ color: theme.primary }}>WhatsApp</ThemedText>
                        </Pressable>
                      ) : null}
                    </View>
                  ) : (
                    <ThemedText type="small" themeColor="textSecondary">{contact.phone || (isLoading ? 'Loading…' : 'Contact coming soon')}</ThemedText>
                  )}
                </View>
              );
            })}
            {!contacts.length ? <ThemedText themeColor="textSecondary">{isLoading ? 'Loading safety contacts…' : 'Safety contacts are currently unavailable. Please contact an organiser in person.'}</ThemedText> : null}
            {error ? (
              <Pressable accessibilityRole="button" onPress={() => void refresh()} disabled={isLoading} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
                <ThemedText type="smallBold" themeColor="primary">{isLoading ? 'Refreshing…' : 'Could not update contacts. Tap to retry.'}</ThemedText>
              </Pressable>
            ) : null}
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
  headerTitle: { fontWeight: '400', color: Brand.cream, flex: 1, fontSize: 24, lineHeight: 29, marginLeft: Spacing.two },
  scroll: { alignSelf: 'center', gap: Spacing.four, maxWidth: MaxContentWidth, paddingBottom: BottomTabInset + Spacing.five, paddingHorizontal: Spacing.three, paddingTop: Spacing.four, width: '100%' },
  section: { gap: 12 },
  safetyBanner: { backgroundColor: '#E3ECE5', borderRadius: 24, padding: 24, gap: 14 },
  safetyTitle: { color: Brand.pine, fontWeight: '500', fontSize: 19, lineHeight: 26 },
  safetyCopy: { color: Brand.pine, fontSize: 17, lineHeight: 26 },
  codeWordBanner: { backgroundColor: 'rgba(23,61,44,0.06)', borderRadius: 16, padding: 16, gap: 6 },
  codeWordLabel: { color: Brand.pine, fontSize: 12, letterSpacing: 1.4 },
  codeWord: { color: Brand.pine, fontSize: 32, fontWeight: '500', lineHeight: 40 },
  codeWordDescription: { color: Brand.pine, fontSize: 16, lineHeight: 24 },
  sectionLabel: { fontSize: 12, letterSpacing: 1.8 },
  serviceCard: { borderRadius: 24, borderWidth: 0, overflow: 'hidden', paddingHorizontal: 18 },
  divider: { height: 1 },
  serviceRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 76, paddingVertical: 12 },
  serviceName: { flex: 1, fontSize: 17, lineHeight: 22, paddingRight: Spacing.two },
  serviceAction: { alignItems: 'flex-end', gap: 1 },
  serviceNumber: { fontSize: 22, fontWeight: '500', lineHeight: 26 },
  callHint: { fontSize: 12 },
  staffList: { borderRadius: 24, paddingHorizontal: 18 },
  staffCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingVertical: 18 },
  staffCardStacked: { flexDirection: 'column', alignItems: 'stretch', gap: 8 },
  staffIdentity: { gap: 3, flex: 1, minWidth: 0 },
  staffRole: { fontSize: 15, lineHeight: 22 },
  staffName: { fontSize: 18, lineHeight: 24 },
  staffActions: { alignItems: 'flex-end', maxWidth: '52%' },
  staffActionsStacked: { alignItems: 'flex-start', maxWidth: '100%' },
  whatsappLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  whatsappLogo: { width: 22, height: 22 },
  contactLink: { minHeight: 44, justifyContent: 'center' },
  phoneNumber: { fontSize: 16, lineHeight: 22, textAlign: 'right' },
  actionButton: { alignItems: 'center', borderRadius: 11, flex: 1, justifyContent: 'center', minHeight: 48, minWidth: 0, paddingHorizontal: Spacing.two },
  pressed: { opacity: 0.72 },
});
