import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';

export function RemoveConfirmation({ confirming, prompt, label, busy = false, disabled = false, onStart, onConfirm, onCancel }: {
  confirming: boolean; prompt: string; label: string; busy?: boolean; disabled?: boolean;
  onStart: () => void; onConfirm: () => void; onCancel: () => void;
}) {
  const blocked = busy || disabled;
  return <View>
    {confirming ? <>
      <ThemedText type="small">{prompt}</ThemedText>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" disabled={blocked} accessibilityState={{ disabled: blocked, busy }} onPress={onConfirm} style={styles.button}>
          <ThemedText type="smallBold" themeColor="danger">{busy ? 'Removing…' : 'Yes, remove'}</ThemedText>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={blocked} accessibilityState={{ disabled: blocked }} onPress={onCancel} style={styles.button}>
          <ThemedText type="smallBold">Cancel</ThemedText>
        </Pressable>
      </View>
    </> : <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={blocked} accessibilityState={{ disabled: blocked }} onPress={onStart} style={styles.button}>
      <ThemedText type="smallBold" themeColor="danger">Remove</ThemedText>
    </Pressable>}
  </View>;
}
const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  button: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
});
