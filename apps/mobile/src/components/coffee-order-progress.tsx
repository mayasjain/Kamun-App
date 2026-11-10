import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { coffeeProgress } from '@/lib/coffee-display';
import type { Order } from '@/lib/coffee-types';

export function CoffeeOrderProgress({ order }: { order: Order }) {
  const theme = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 480 || fontScale > 1.2;
  const progress = coffeeProgress(order);
  if (!progress) return null;
  return <View accessible accessibilityRole="progressbar" accessibilityLabel={`Order ${order.dayCode} progress`}
    accessibilityValue={{ min: 0, max: 3, now: progress.index, text: progress.labels[progress.index] }}
    style={[styles.track, stacked && styles.trackStacked]}>
    {progress.labels.map((label, index) => {
      const complete = index < progress.index;
      const current = index === progress.index;
      return <View key={label} style={[styles.step, stacked && styles.stepStacked]}>
        <View style={[styles.dot, { backgroundColor: index <= progress.index ? theme.primary : theme.background, borderColor: index <= progress.index ? theme.primary : theme.border }]}>
          <ThemedText type="smallBold" style={{ color: index <= progress.index ? theme.onPrimary : theme.textSecondary }}>{complete ? '✓' : index + 1}</ThemedText>
        </View>
        <ThemedText type="small" style={[styles.label, { color: index <= progress.index ? theme.primary : theme.textSecondary }, current && styles.current]}>{label}{current ? ' · current' : ''}</ThemedText>
      </View>;
    })}
  </View>;
}
const styles = StyleSheet.create({
  track: { flexDirection: 'row', gap: 12, paddingVertical: 12 },
  trackStacked: { flexDirection: 'column', gap: 10 },
  step: { flex: 1, minWidth: 0, alignItems: 'center', gap: 6 },
  stepStacked: { flex: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 28, minHeight: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, lineHeight: 18, flexShrink: 1 },
  current: { fontWeight: '600' },
});
