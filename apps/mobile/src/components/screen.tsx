import { type PropsWithChildren, type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenProps = PropsWithChildren<{
  compactHeader?: boolean;
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
}>;

export function Screen({ eyebrow, title, subtitle, children, onRefresh, refreshing = false, compactHeader = false }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const headingLabel = (eyebrow.charAt(0) + eyebrow.slice(1).toLowerCase()).replace(/kamun/gi, 'KAMUN');
  const phone = useWindowDimensions().width < 600;

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, phone && styles.phoneContent, { paddingBottom: BottomTabInset + Spacing.five + insets.bottom }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} /> : undefined}>
          <View style={styles.header}>
            {eyebrow ? <View style={styles.eyebrowRow}>
              <ThemedText type="small" style={{ color: theme.primary, fontWeight: '400' }}>{headingLabel}</ThemedText>
            </View> : null}
            <ThemedText type="title" style={[styles.title, phone && styles.phoneTitle, compactHeader && styles.compactTitle, { color: theme.primary, fontWeight: '400' }]}>{title}</ThemedText>
            {subtitle ? <ThemedText themeColor="textSecondary" style={compactHeader ? styles.compactSubtitle : undefined}>{subtitle}</ThemedText> : null}
          </View>
          <View style={styles.body}>{children}</View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0 },
  safeArea: { flex: 1, minHeight: 0, alignItems: 'center' },
  scroll: { flex: 1, minHeight: 0, width: '100%' },
  content: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.five,
    gap: Spacing.five,
  },
  phoneContent: { paddingHorizontal: 16, paddingTop: 12, gap: 18 },
  compactTitle: { fontWeight: '400', letterSpacing: -0.3 },
  compactSubtitle: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  phoneTitle: { fontSize: 26, lineHeight: 32 },
  header: { gap: Spacing.two, paddingTop: Spacing.two },
  eyebrowRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.two },
  title: { fontSize: 34, lineHeight: 40 },
  body: { gap: Spacing.three },
});
