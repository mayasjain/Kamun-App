import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const services = [
  { name: 'Fire & ambulance', number: '112' },
  { name: 'Police', number: '110' },
];

export default function EmergencyScreen() {
  const theme = useTheme();
  const [linkError, setLinkError] = useState('');

  async function openLink(url: string) {
    setLinkError('');
    try {
      await Linking.openURL(url);
    } catch {
      setLinkError('This contact link could not be opened. Please use the number shown on the page.');
    }
  }

  return (
    <Screen eyebrow="KAMUN 2026" title="Emergency services" subtitle="Public emergency numbers in Germany">
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

      {linkError ? <ThemedText type="small" themeColor="danger" accessibilityRole="alert">{linkError}</ThemedText> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  serviceCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', paddingHorizontal: 18 },
  divider: { height: 1 },
  serviceRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 76, paddingVertical: 12 },
  serviceName: { flex: 1, fontSize: 16, lineHeight: 22, paddingRight: Spacing.two },
  serviceAction: { alignItems: 'flex-end', gap: 1 },
  serviceNumber: { fontSize: 22, fontWeight: '500', lineHeight: 26 },
  callHint: { fontSize: 12 },
  pressed: { opacity: 0.72 },
});
