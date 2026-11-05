import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { partnerGroups } from '@/constants/partners';
import { Brand, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function PartnersScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const [gridWidth, setGridWidth] = useState(0);
  const availableWidth = gridWidth || Math.min(width, MaxContentWidth) - Spacing.four * 2;
  const columns = fontScale > 1.3 || availableWidth < 300 ? 1 : availableWidth >= 640 ? 3 : 2;
  const cardWidth = (availableWidth - Spacing.twoAndHalf * (columns - 1)) / columns;

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
          <View style={styles.grid} onLayout={({ nativeEvent }) => setGridWidth(nativeEvent.layout.width)}>
            {group.entries.map((partner) => (
              <View key={partner.name} style={[styles.card, { width: cardWidth, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <View style={[styles.logoFrame, partner.insetCircle && styles.circularLogoFrame]}>
                  {partner.insetCircle ? (
                    <View style={styles.logoDisc}>
                      <View style={styles.insetCircle}>
                        <Image source={partner.logo} style={styles.insetCircleImage} resizeMode="contain" accessibilityLabel={`${partner.name} logo`} />
                      </View>
                    </View>
                  ) : (
                    <Image source={partner.logo} style={styles.logo} resizeMode="contain" accessibilityLabel={`${partner.name} logo`} />
                  )}
                </View>
                <ThemedText style={styles.partnerName}>{partner.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.partnerDetail}>{partner.detail}</ThemedText>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.twoAndHalf },
  card: { alignItems: 'center', borderWidth: 1, borderRadius: Radius.card, padding: Spacing.twoAndHalf, gap: Spacing.two },
  logoFrame: { width: '100%', height: 128, borderRadius: Radius.control, flexShrink: 0, backgroundColor: Brand.white, padding: Spacing.twoAndHalf, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.one },
  logo: { width: '100%', height: '100%', maxWidth: 176 },
  // The 161×156 SGMUN source includes navy outside its white backing.
  // Mask only that backing; the complete green crest fits inside this inset.
  circularLogoFrame: { backgroundColor: 'transparent' },
  logoDisc: { width: 104, height: 104, borderRadius: 52, backgroundColor: Brand.white, alignItems: 'center', justifyContent: 'center' },
  insetCircle: { width: 92, height: 92, borderRadius: 46, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  insetCircleImage: { width: 92 * 161 / 148, height: 92 * 156 / 148, flexShrink: 0 },
  partnerName: { fontWeight: '700', fontSize: 16, lineHeight: 22, textAlign: 'center' },
  partnerDetail: { textAlign: 'center', fontSize: 13, lineHeight: 19 },
});
