import { type PropsWithChildren, type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type ContentCardProps = PropsWithChildren<{
  label: string;
  title: string;
  preview?: ReactNode;
  urgent?: boolean;
}>;

export function ContentCard({ label, title, preview, children, urgent = false }: ContentCardProps) {
  const theme = useTheme();
  const phone = useWindowDimensions().width < 600;

  return (
    <View
      style={[
        styles.card,
        phone && { padding: 14 },
        {
          backgroundColor: theme.backgroundElement,
          borderColor: urgent ? theme.danger : theme.border,
          borderLeftWidth: urgent ? 5 : 1,
        },
      ]}>
      <View style={styles.header}>
        <View style={styles.heading}>
          {urgent ? <View style={[styles.urgentBadge, { backgroundColor: theme.danger }]}>
            <ThemedText type="smallBold" themeColor="onDanger">URGENT</ThemedText>
          </View> : null}
          <ThemedText type="smallBold" style={styles.label} themeColor="primary">
            {label}
          </ThemedText>
          <ThemedText accessibilityRole="header" type="subtitle" style={[styles.title, phone && { fontSize: 18, lineHeight: 24 }]}>
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
  urgentBadge: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  card: { borderWidth: 1, borderRadius: 18, padding: 20, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heading: { flex: 1, minWidth: 0, gap: 8 },
  label: { fontSize: 12, letterSpacing: 1.1 },
  title: { fontSize: 22, lineHeight: 28 },
});
