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
      <ThemedText type="smallBold" style={{ color: accent ? '#FFFFFF' : theme.primary }}>
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
  card: { borderWidth: 1, borderRadius: 24, padding: 20, gap: 8 },
  title: { fontSize: 24, lineHeight: 30 },
  onAccent: { color: '#FFFFFF' },
});
