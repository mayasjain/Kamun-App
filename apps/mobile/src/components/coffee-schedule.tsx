import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { coffeeDayLabel, coffeeFulfilmentLabel, coffeeScheduleDays } from '@/lib/coffee-display';
import type { Schedule } from '@/lib/coffee-types';

export function CoffeeSchedule({ schedule }: { schedule: Schedule }) {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const days = coffeeScheduleDays(schedule.blocks);
  return <View style={styles.section}>
    <ThemedText accessibilityRole="header" style={styles.heading}>Coffee opening times</ThemedText>
    <ThemedText type="small" themeColor="textSecondary">All times are in Karlsruhe (Europe/Berlin). Ordering also depends on the live queue.</ThemedText>
    {!days.length ? <ThemedText type="small" themeColor="textSecondary">Opening times have not been published yet.</ThemedText> : null}
    {days.map(({ day, blocks }) => <View key={day} style={[styles.day, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <ThemedText accessibilityRole="header" type="smallBold" themeColor="primary" style={styles.dayHeading}>{coffeeDayLabel(day)}</ThemedText>
      {blocks.map(block => {
        const current = schedule.current?.id === block.id;
        return <View key={block.id} style={[styles.row, fontScale > 1.2 && styles.stacked, { borderTopColor: theme.border }, current && { backgroundColor: theme.primarySoft }]}>
          <ThemedText type="smallBold" style={styles.time}>{block.start}–{block.end}</ThemedText>
          <View style={styles.copy}>
            <ThemedText type="smallBold">{block.label}{current ? ' · Now' : ''}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">{coffeeFulfilmentLabel(block.fulfilment)}</ThemedText>
          </View>
        </View>;
      })}
    </View>)}
  </View>;
}
const styles = StyleSheet.create({
  section: { gap: 12 },
  heading: { fontSize: 19, lineHeight: 26, fontWeight: '500' },
  day: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  dayHeading: { padding: 16, fontSize: 15, lineHeight: 22 },
  row: { flexDirection: 'row', gap: 14, padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
  stacked: { flexDirection: 'column', gap: 6 },
  time: { fontSize: 13, lineHeight: 20, flexShrink: 0 },
  copy: { flex: 1, minWidth: 0, gap: 4 },
});
