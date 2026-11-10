import { useState } from 'react';
import { Link } from 'expo-router';
import { Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { partnerGroups } from '@/constants/partners';
import { Brand, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function PartnersScreen() {
  const theme = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const [gridWidth, setGridWidth] = useState(0);
  const availableWidth = gridWidth || Math.min(width, MaxContentWidth) - Spacing.four * 2;
  const columns = fontScale > 1.3 || availableWidth < 300 ? 1 : availableWidth >= 640 ? 3 : 2;
  const cardWidth = (availableWidth - Spacing.twoAndHalf * (columns - 1)) / columns;

  const logoSize = Math.min(width < 600 ? 64 : 80, Math.max(0, cardWidth - Spacing.twoAndHalf * 2 - 2));

  return (
    <Screen eyebrow="KAMUN 2026" title="Sponsors & partners" subtitle="The organisations and conferences helping make KAMUN possible.">

      <View style={styles.thanks}>
        <ThemedText type="smallBold" style={styles.eyebrow}>WITH GRATITUDE</ThemedText>
        <ThemedText type="subtitle" style={styles.thanksTitle}>Thank you for being part of KAMUN.</ThemedText>
        <ThemedText style={styles.thanksCopy}>To our sponsors, institutional partners and fellow conferences: thank you for supporting our community and the conversations that bring us together.</ThemedText>
      </View>

      {partnerGroups.map((group) => {
        const groupColumns = group.title === 'In-kind sponsors' ? Math.min(columns, 2) : columns;
        const groupCardWidth = (availableWidth - Spacing.twoAndHalf * (groupColumns - 1)) / groupColumns;
        return (
        <View key={group.title} style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.groupTitle} accessibilityRole="header">{group.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">{group.description}</ThemedText>
          </View>
          <View style={styles.grid} onLayout={({ nativeEvent }) => setGridWidth(nativeEvent.layout.width)}>
            {group.entries.map((partner) => (
              <Link key={partner.name} href={partner.url} target="_blank" rel="noopener noreferrer" asChild>
              <Pressable accessibilityRole="link" accessibilityLabel={`${partner.name} — visit website`} accessibilityHint="Opens an external website" style={StyleSheet.flatten([styles.card, { width: groupCardWidth, backgroundColor: theme.backgroundElement, borderColor: theme.border }])}>
                <View style={[styles.logoFrame, { width: logoSize, height: logoSize, borderRadius: logoSize / 2 }, partner.logoBackground ? { backgroundColor: partner.logoBackground } : null]}>
                  {partner.logo ? (
                    <Image source={partner.logo} style={[styles.logo, partner.logoFit === 'contain' ? styles.containedLogo : { borderRadius: logoSize / 2 }]} resizeMode={partner.logoFit ?? "cover"} accessibilityLabel={`${partner.name} logo`} />
                  ) : (
                    <ThemedText accessible={false} style={styles.partnerInitials}>{partner.initials}</ThemedText>
                  )}
                </View>
                <ThemedText style={styles.partnerName}>{partner.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.partnerDetail}>{partner.detail}</ThemedText>
              </Pressable>
              </Link>
            ))}
          </View>
        </View>
      ); })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  thanks: { backgroundColor: Brand.pine, borderRadius: Radius.feature, padding: 16, gap: 10 },
  eyebrow: { color: Brand.gold, fontSize: 12, lineHeight: 18, letterSpacing: 0.6 },
  thanksTitle: { color: Brand.white, fontSize: 18, lineHeight: 24 },
  thanksCopy: { color: Brand.cream, fontSize: 14, lineHeight: 21 },
  groupTitle: { fontSize: 19, lineHeight: 25 },
  section: { gap: 12, marginTop: 12 },
  sectionHeader: { gap: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.twoAndHalf },
  card: { alignItems: 'center', borderWidth: 1, borderRadius: Radius.card, padding: Spacing.twoAndHalf, gap: Spacing.two },
  logoFrame: { flexShrink: 0, overflow: 'hidden', backgroundColor: Brand.white, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.one },
  logo: { width: '100%', height: '100%' },
  containedLogo: { width: '84%', height: '84%' },
  partnerInitials: { color: Brand.pine, fontSize: 28, lineHeight: 36, fontWeight: '500' },
  partnerName: { fontWeight: '500', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  partnerDetail: { textAlign: 'center', fontSize: 13, lineHeight: 19 },
});
