import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { partnerGroups } from '@/constants/partners';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function PartnersScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const twoColumns = width >= 600 && fontScale <= 1.3;

  return (
    <Screen eyebrow="KAMUN 2026" title="Sponsors & partners" subtitle="The organisations and conferences helping make KAMUN possible.">
      <Pressable accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
        <ThemedText type="smallBold" themeColor="primary">← Back</ThemedText>
      </Pressable>

      <View style={styles.thanks}>
        <ThemedText type="smallBold" style={styles.eyebrow}>WITH GRATITUDE</ThemedText>
        <ThemedText type="subtitle" style={styles.thanksTitle}>Thank you for being part of KAMUN.</ThemedText>
        <ThemedText style={styles.thanksCopy}>To our sponsors, institutional partners and fellow conferences: thank you for supporting our community and the conversations that bring us together.</ThemedText>
      </View>

      {partnerGroups.map((group) => (
        <View key={group.title} style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" accessibilityRole="header">{group.title}</ThemedText>
            <ThemedText themeColor="textSecondary">{group.description}</ThemedText>
          </View>
          <View style={styles.grid}>
            {group.entries.map((partner) => (
              <View key={partner.name} style={[styles.card, twoColumns && styles.halfCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <View style={styles.logoFrame}>
                  <Image source={partner.logo} style={styles.logo} resizeMode="cover" accessibilityLabel={`${partner.name} logo`} />
                </View>
                <ThemedText style={styles.partnerName}>{partner.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{partner.detail}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start', paddingRight: Spacing.three },
  pressed: { opacity: 0.7 },
  thanks: { backgroundColor: Brand.pine, borderRadius: Radius.feature, padding: Spacing.four, gap: Spacing.three },
  eyebrow: { color: Brand.gold, letterSpacing: 1.1 },
  thanksTitle: { color: Brand.white },
  thanksCopy: { color: Brand.cream },
  section: { gap: Spacing.three, marginTop: Spacing.four },
  sectionHeader: { gap: Spacing.two },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.twoAndHalf },
  card: { width: '100%', borderWidth: 1, borderRadius: Radius.card, padding: Spacing.three, gap: Spacing.two },
  halfCard: { width: '48%', flexGrow: 1, maxWidth: '50%' },
  logoFrame: { width: 96, height: 96, borderRadius: 48, flexShrink: 0, backgroundColor: Brand.white, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.two },
  logo: { width: 96, height: 96, borderRadius: 48 },
  partnerName: { fontWeight: '700', fontSize: 18, lineHeight: 26 },
});
