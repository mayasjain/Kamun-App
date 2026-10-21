import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SavedCode = { label: string; code: string };
const delegateCode: SavedCode = { label: 'Delegate', code: 'KAMUN-MEMBER' };

function localTestCodes(): SavedCode[] {
  if (!__DEV__) return [];
  try {
    const parsed: unknown = JSON.parse(process.env.EXPO_PUBLIC_LOCAL_TEST_CODES ?? '[]');
    return Array.isArray(parsed)
      ? parsed.filter((item): item is SavedCode =>
          typeof item?.label === 'string' && typeof item?.code === 'string'
        ).slice(0, 20)
      : [];
  } catch {
    return [];
  }
}

const configuredCodes = localTestCodes();

export function DevelopmentCodes({ onSelect }: { onSelect: (code: string) => void }) {
  const theme = useTheme();

  return <View style={[styles.panel, { backgroundColor: theme.primarySoft }]}>
    <ThemedText type="smallBold" style={{ color: theme.primary }}>LOCAL TEST CODES</ThemedText>
    <ThemedText type="small" themeColor="textSecondary">Tap a code to fill the field above. These codes are available only in local development.</ThemedText>
    {[delegateCode, ...configuredCodes].map((item) => <View key={item.label} style={styles.codeRow}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Use ${item.label} test code`}
        onPress={() => onSelect(item.code)} style={styles.codeButton}>
        <ThemedText type="smallBold">{item.label}: {item.code}</ThemedText>
      </Pressable>
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  panel: { borderRadius: 12, gap: Spacing.two, padding: 14 },
  codeRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  codeButton: { flex: 1, minHeight: 42, justifyContent: 'center' },
});
