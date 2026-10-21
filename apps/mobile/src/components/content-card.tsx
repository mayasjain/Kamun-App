import { type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type ContentCardProps = PropsWithChildren<{
  label: string;
  title: string;
  accent?: boolean;
}>;

export function ContentCard({ label, title, accent = false, children }: ContentCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: accent ? theme.primary : theme.backgroundElement,
          borderColor: accent ? theme.primary : theme.border,
        },
      ]}>
      <ThemedText type="smallBold" style={[styles.label, { color: accent ? '#FFFFFF' : theme.primary }]}>
        {label}
      </ThemedText>
      <ThemedText type="subtitle" style={[styles.title, accent && styles.onAccent]}>
        {title}
      </ThemedText>
      <View>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, padding: 20, gap: 8 },
  label: { fontSize: 12, letterSpacing: 1.1 },
  title: { fontSize: 22, lineHeight: 28 },
  onAccent: { color: '#FFFFFF' },
});
