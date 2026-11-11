import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { secretariat } from '@/constants/secretariat';
import { useConferenceContent } from '@/contexts/conference-content';
import { useTheme } from '@/hooks/use-theme';
import { phoneCallUrl, whatsappChatUrl } from '@/lib/contact-links';

const services = [
  { name: 'Fire & ambulance', number: '112' },
  { name: 'Police', number: '110' },
];

export default function EmergencyScreen() {
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 600 || fontScale > 1.3;
  const photoSize = width < 600 ? 72 : 80;
  const photoScale = photoSize / 112;
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

  return (
    <Screen eyebrow="KAMUN 2026" title="Emergency contacts" subtitle="Support and safety throughout the conference." onRefresh={() => void refresh()} refreshing={isLoading}>
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
          <ThemedText accessibilityRole="header" type="smallBold" style={[styles.sectionLabel, { color: theme.primary }]}>EMERGENCY SERVICES</ThemedText>
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
          <ThemedText accessibilityRole="header" type="smallBold" style={[styles.sectionLabel, { color: theme.primary }]}>STAFF CONTACTS</ThemedText>
          <View style={styles.staffList}>
            {contacts.map((contact) => {
              const name = contact.personName ?? contact.label;
              const portraitName = name === 'Mani Kondapavuluri' || name === 'Mani'
                ? 'Venkata Mani Madhava Sai Kondapavuluri' : name === 'Mahima' ? 'Mahima Rajpal' : name;
              const person = secretariat.find(person => person.name.toLowerCase() === portraitName.trim().toLowerCase());
              const callUrl = phoneCallUrl(contact.phone);
              const whatsappUrl = whatsappChatUrl(contact.phone);
              return (
                <View key={contact.id} style={[styles.staffCard, stacked && styles.staffCardStacked, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                  <View style={styles.staffProfile}>
                    {person?.photo && person.photoLayout ? <View style={{ width: photoSize, height: photoSize, borderRadius: photoSize / 2, overflow: 'hidden', flexShrink: 0, backgroundColor: theme.primarySoft }}>
                      <Image source={person.photo} resizeMode="contain" accessibilityLabel={name}
                        style={{ position: 'absolute', width: person.photoLayout.width * photoScale, height: person.photoLayout.height * photoScale, left: person.photoLayout.left * photoScale, top: person.photoLayout.top * photoScale }} />
                    </View> : null}
                    <View style={styles.staffIdentity}>
                    <ThemedText type="smallBold" style={styles.staffName}>{name}</ThemedText>
                    {contact.role ? <ThemedText style={styles.staffRole} themeColor="textSecondary">{contact.role}</ThemedText> : null}
                    </View>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  safetyBanner: { backgroundColor: '#E3ECE5', borderRadius: 18, padding: 16, gap: 12 },
  safetyTitle: { color: Brand.pine, fontWeight: '500', fontSize: 16, lineHeight: 22 },
  safetyCopy: { color: Brand.pine, fontSize: 14, lineHeight: 22 },
  codeWordBanner: { backgroundColor: 'rgba(23,61,44,0.06)', borderRadius: 16, padding: 16, gap: 6 },
  codeWordLabel: { color: Brand.pine, fontSize: 12, letterSpacing: 1.4 },
  codeWord: { color: Brand.pine, fontSize: 26, fontWeight: '500', lineHeight: 34 },
  codeWordDescription: { color: Brand.pine, fontSize: 14, lineHeight: 22 },
  sectionLabel: { fontSize: 12, letterSpacing: 1.8 },
  serviceCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', paddingHorizontal: 18 },
  divider: { height: 1 },
  serviceRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 76, paddingVertical: 12 },
  serviceName: { flex: 1, fontSize: 16, lineHeight: 22, paddingRight: Spacing.two },
  serviceAction: { alignItems: 'flex-end', gap: 1 },
  serviceNumber: { fontSize: 22, fontWeight: '500', lineHeight: 26 },
  callHint: { fontSize: 12 },
  staffList: { gap: 12 },
  staffCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: 14, borderRadius: 18, borderWidth: 1 },
  staffCardStacked: { flexDirection: 'column', alignItems: 'stretch', gap: 8 },
  staffIdentity: { gap: 3, flex: 1, minWidth: 0 },
  staffProfile: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 },
  staffRole: { fontSize: 14, lineHeight: 22 },
  staffName: { fontSize: 16, lineHeight: 22 },
  staffActions: { alignItems: 'flex-end', maxWidth: '52%' },
  staffActionsStacked: { alignItems: 'flex-start', maxWidth: '100%' },
  whatsappLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  whatsappLogo: { width: 22, height: 22 },
  contactLink: { minHeight: 44, justifyContent: 'center' },
  phoneNumber: { fontSize: 16, lineHeight: 22, textAlign: 'right' },
  actionButton: { alignItems: 'center', borderRadius: 11, flex: 1, justifyContent: 'center', minHeight: 48, minWidth: 0, paddingHorizontal: Spacing.two },
  pressed: { opacity: 0.72 },
});
