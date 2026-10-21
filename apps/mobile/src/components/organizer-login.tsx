import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useOrganizer } from '@/contexts/organizer';
import { useTheme } from '@/hooks/use-theme';

export function OrganizerLogin() {
  const theme = useTheme();
  const organizer = useOrganizer();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!code.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      await organizer.signIn(code);
      setCode('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not sign in. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen eyebrow="KAMUN ORGANISER" title="Enter organiser code" subtitle="Use the private code from the conference team to send official updates.">
      <View style={styles.form}>
        <ThemedText type="smallBold">ORGANISER CODE</ThemedText>
        <TextInput accessibilityLabel="Private organiser code" autoCapitalize="characters" autoCorrect={false}
          onChangeText={setCode} onSubmitEditing={() => void submit()} placeholder="Enter your code"
          placeholderTextColor={theme.textSecondary} secureTextEntry
          style={[styles.input, { backgroundColor: theme.backgroundElement, borderColor: theme.border, color: theme.text }]} value={code} />
        {error ? <ThemedText type="small" themeColor="danger">{error}</ThemedText> : null}
        <Pressable accessibilityRole="button" disabled={busy || !code.trim()} onPress={() => void submit()}
          style={[styles.primaryButton, { backgroundColor: busy || !code.trim() ? theme.border : theme.primary }]}>
          <ThemedText type="smallBold" style={{ color: theme.backgroundElement }}>{busy ? 'Checking code…' : 'Continue as organiser'}</ThemedText>
        </Pressable>
        <ThemedText type="small" themeColor="textSecondary">Keep this code private. Anyone with it can publish conference updates.</ThemedText>
        <Pressable accessibilityRole="button" onPress={() => void organizer.cancel()} style={styles.secondaryButton}>
          <ThemedText themeColor="primary">Back to attendee access</ThemedText>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.two },
  input: { borderRadius: 12, borderWidth: 1, fontSize: 17, minHeight: 54, paddingHorizontal: 16 },
  primaryButton: { alignItems: 'center', borderRadius: 12, justifyContent: 'center', minHeight: 54, marginTop: Spacing.three },
  secondaryButton: { alignItems: 'center', justifyContent: 'center', minHeight: 48 },
});
