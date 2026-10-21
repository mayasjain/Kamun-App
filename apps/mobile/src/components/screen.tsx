import { type PropsWithChildren, type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
}>;

export function Screen({ eyebrow, title, subtitle, children, onRefresh, refreshing = false }: ScreenProps) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} /> : undefined}>
          <View style={styles.header}>
            <View style={styles.eyebrowRow}>
              <View style={[styles.eyebrowRule, { backgroundColor: theme.accent }]} />
              <ThemedText type="smallBold" style={{ color: theme.primary }}>{eyebrow}</ThemedText>
            </View>
            <ThemedText type="title" style={styles.title}>{title}</ThemedText>
            {subtitle ? <ThemedText themeColor="textSecondary">{subtitle}</ThemedText> : null}
          </View>
          <View style={styles.body}>{children}</View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1, alignItems: 'center' },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.five,
    gap: Spacing.five,
  },
  header: { gap: Spacing.two, paddingTop: Spacing.two },
  eyebrowRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.two },
  eyebrowRule: { borderRadius: 2, height: 3, width: 28 },
  title: { fontSize: 38, lineHeight: 43 },
  body: { gap: Spacing.three },
});
