import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useAttendeeProfile } from '@/contexts/attendee-profile';
import { demoAccessCodes } from '@/data/demo';
import { useTheme } from '@/hooks/use-theme';

type Props = { submitLabel?: string };

export function AttendeeProfileForm({ submitLabel = 'Continue to KAMUN' }: Props) {
  const theme = useTheme();
  const { saveProfile } = useAttendeeProfile();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  function submit() {
    const normalizedCode = code.trim().toUpperCase();
    const access = demoAccessCodes[normalizedCode as keyof typeof demoAccessCodes];
    if (!access) {
      setError('This code is not valid. Check it and try again.');
      return;
    }
    setError('');
    saveProfile({ accessLabel: access.label, position: access.position });
  }

  return (
    <View style={styles.form}>
      <View style={styles.field}>
        <ThemedText type="smallBold">ACCESS CODE</ThemedText>
        <TextInput
          accessibilityLabel="KAMUN access code"
          autoCapitalize="characters"
          autoCorrect={false}
          onChangeText={(value) => {
            setCode(value);
            if (error) setError('');
          }}
          onSubmitEditing={submit}
          placeholder="Enter your code"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          value={code}
        />
        {error ? <ThemedText type="small" style={styles.error}>{error}</ThemedText> : null}
      </View>

      <View style={[styles.hint, { backgroundColor: theme.primarySoft }]}>
        <ThemedText type="smallBold" style={{ color: theme.primary }}>PREVIEW CODES</ThemedText>
        <ThemedText type="small">Chair: KAMUN-CHAIR</ThemedText>
        <ThemedText type="small">Committee member: KAMUN-MEMBER</ThemedText>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={!code.trim()}
        onPress={submit}
        style={[styles.submit, { backgroundColor: code.trim() ? theme.primary : theme.border }]}
      >
        <ThemedText type="smallBold" style={styles.submitText}>{submitLabel}</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.four },
  field: { gap: Spacing.two },
  input: { borderWidth: 1, borderRadius: 14, fontSize: 16, paddingHorizontal: 16, paddingVertical: 14 },
  error: { color: '#B42318' },
  hint: { borderRadius: 14, gap: Spacing.one, padding: 14 },
  submit: { alignItems: 'center', borderRadius: 16, marginTop: Spacing.two, padding: 16 },
  submitText: { color: Colors.light.background },
});
