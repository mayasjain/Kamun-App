import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useAttendeeProfile } from '@/contexts/attendee-profile';
import { claimAttendeeAccess } from '@/lib/attendee-access';
import { useTheme } from '@/hooks/use-theme';
import { useOrganizer } from '@/contexts/organizer';
import { DevelopmentCodes } from '@/components/development-codes';

type Props = { submitLabel?: string };

export function AttendeeProfileForm({ submitLabel = 'Continue to KAMUN' }: Props) {
  const theme = useTheme();
  const { saveProfile } = useAttendeeProfile();
  const organizer = useOrganizer();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    if (!code.trim() || isSubmitting) return;
    setError('');
    setIsSubmitting(true);
    try {
      try {
        const access = await claimAttendeeAccess(code);
        saveProfile(access);
      } catch {
        await organizer.signIn(code);
      }
      setCode('');
    } catch {
      setError('This access code could not be verified. Check the code and try again.');
    } finally {
      setIsSubmitting(false);
    }
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
          onSubmitEditing={() => void submit()}
          placeholder="Enter your code"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { backgroundColor: theme.backgroundElement, borderColor: error ? theme.danger : theme.border, color: theme.text }]}
          value={code}
        />
        {error ? <ThemedText type="small" style={styles.error}>{error}</ThemedText> : null}
      </View>

      {__DEV__ ? <DevelopmentCodes onSelect={(selected) => { setCode(selected); setError(''); }} /> : null}

      <Pressable
        accessibilityRole="button"
        disabled={!code.trim() || isSubmitting}
        onPress={() => void submit()}
        style={[styles.submit, { backgroundColor: code.trim() && !isSubmitting ? Brand.gold : theme.border }]}
      >
        <ThemedText type="smallBold" style={styles.submitText}>{isSubmitting ? 'Checking code…' : submitLabel}</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.four },
  field: { gap: Spacing.two },
  input: { borderWidth: 1, borderRadius: 12, fontSize: 17, minHeight: 54, paddingHorizontal: 16, paddingVertical: 14 },
  error: { color: '#B42318' },
  submit: { alignItems: 'center', borderRadius: 12, justifyContent: 'center', minHeight: 54, padding: 16 },
  submitText: { color: Brand.black },
});
