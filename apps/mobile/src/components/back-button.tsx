import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';

export function BackButton() {
  const router = useRouter();
  return <Pressable accessibilityRole="button" accessibilityLabel="Go back"
    onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
    style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}>
    <ThemedText themeColor="primary" style={styles.label}>← Back</ThemedText>
  </Pressable>;
}

const styles = StyleSheet.create({
  button: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start', paddingRight: 16 },
  label: { fontSize: 18, lineHeight: 26, fontWeight: '400' },
});
