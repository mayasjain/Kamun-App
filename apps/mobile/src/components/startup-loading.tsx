import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export function StartupLoading() {
  const theme = useTheme();
  const [takingLonger, setTakingLonger] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setTakingLonger(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  return <ThemedView style={styles.root}>
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <ThemedText accessibilityRole="header" type="subtitle" themeColor="primary">KAMUN 2026</ThemedText>
        <ActivityIndicator color={theme.primary} accessibilityLabel="Restoring conference access" />
        <ThemedText themeColor="textSecondary">Restoring your conference access…</ThemedText>
        {takingLonger ? <ThemedText type="small" themeColor="textSecondary" accessibilityLiveRegion="polite" style={styles.hint}>This is taking longer than usual. Check your connection. If this screen persists, close and reopen the app.</ThemedText> : null}
      </View>
    </SafeAreaView>
  </ThemedView>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { width: '100%', maxWidth: 420, padding: 24, alignItems: 'center', gap: 20 },
  hint: { textAlign: 'center' },
});
