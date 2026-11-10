import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useAttendeeProfile } from '@/contexts/attendee-profile';
import { claimAttendeeAccess, claimLegacyChairAccess, claimLegacyMemberAccess } from '@/lib/attendee-access';
import { useTheme } from '@/hooks/use-theme';
import { useOrganizer } from '@/contexts/organizer';
import { closeEcgSession } from '@/lib/ecg-session';
import { codeKind } from '@/lib/code-kind';

type Props = { submitLabel?: string; disabled?: boolean; onSubmittingChange?: (busy: boolean) => void };

export function AttendeeProfileForm({ submitLabel = 'Continue to KAMUN', disabled = false, onSubmittingChange }: Props) {
  const theme = useTheme();
  const { saveProfile, clearProfile, profile } = useAttendeeProfile();
  const organizer = useOrganizer();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    if (!code.trim() || isSubmitting || disabled) return;
    setError('');
    setIsSubmitting(true);
    onSubmittingChange?.(true);
    try {
      const kind = codeKind(code);
      if (profile?.identitySource === 'ecg' && kind !== 'ecg') {
        await closeEcgSession();
        clearProfile();
      }
      if (kind === 'organizer') {
        await organizer.signIn(code);
      } else {
        const access = kind === 'chair' ? await claimLegacyChairAccess(code)
          : kind === 'legacy_member' ? await claimLegacyMemberAccess(code)
            : await claimAttendeeAccess(code);
        saveProfile(access);
      }
      setCode('');
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : '';
      setError(reason === 'unavailable' || reason.includes('Failed to fetch')
        ? 'Verification is unavailable. Check your connection and try again.'
        : reason === 'rate_limited'
          ? 'Too many attempts. Please wait 15 minutes before trying again.'
          : reason === 'unauthorized'
            ? 'Your session has expired. Reload KAMUN and try again.'
          : 'This code could not be verified. Check it and try again.');
    } finally {
      setIsSubmitting(false);
      onSubmittingChange?.(false);
    }
  }

  return (
    <View style={styles.form}>
      <View style={styles.field}>
        <ThemedText type="smallBold">YOUR CODE</ThemedText>
        <TextInput
          accessibilityLabel="Your KAMUN code"
          editable={!disabled && !isSubmitting}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="go"
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
        {error ? <ThemedText accessibilityRole="alert" accessibilityLiveRegion="polite" type="small" themeColor="danger">{error}</ThemedText> : null}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={!code.trim() || isSubmitting || disabled}
        onPress={() => void submit()}
        style={[styles.submit, { backgroundColor: code.trim() && !isSubmitting && !disabled ? Brand.gold : theme.disabledBackground }]}
      >
        <ThemedText type="smallBold" style={{ color: code.trim() && !isSubmitting && !disabled ? Brand.black : theme.disabledText }}>{isSubmitting ? 'Checking code…' : submitLabel}</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.four },
  field: { gap: Spacing.two },
  input: { borderWidth: 1, borderRadius: 12, fontSize: 17, minHeight: 54, paddingHorizontal: 16, paddingVertical: 14 },
  submit: { alignItems: 'center', borderRadius: 12, justifyContent: 'center', minHeight: 54, padding: 16 },
});
