import { type PropsWithChildren, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type ContentCardProps = PropsWithChildren<{
  label: string;
  title: string;
  preview?: ReactNode;
}>;

export function ContentCard({ label, title, preview, children }: ContentCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}>
      <View style={styles.header}>
        <View style={styles.heading}>
          <ThemedText type="smallBold" style={styles.label} themeColor="primary">
            {label}
          </ThemedText>
          <ThemedText type="subtitle" style={styles.title}>
            {title}
          </ThemedText>
          {preview ? <View>{children}</View> : null}
        </View>
        {preview}
      </View>
      {!preview ? <View>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, padding: 20, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heading: { flex: 1, minWidth: 0, gap: 8 },
  label: { fontSize: 12, letterSpacing: 1.1 },
  title: { fontSize: 22, lineHeight: 28 },
});
