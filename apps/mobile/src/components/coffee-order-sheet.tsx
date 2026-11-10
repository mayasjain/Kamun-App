import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { CoffeeOrderInput } from '@/lib/coffee-client';
import { coffeeMoney } from '@/lib/coffee-display';
import type { MenuItem } from '@/lib/coffee-types';

export type CoffeeDraft = { item: MenuItem; key: string; uncertain: boolean; submitted?: CoffeeOrderInput };
export function CoffeeOrderSheet({ draft, item, paid, free, chooseFulfilment, online, busy, onClose, onSubmit, onRefresh }: {
  draft: CoffeeDraft; item: MenuItem; paid: boolean; free: boolean; chooseFulfilment: boolean;
  online: boolean; busy: boolean; onClose: () => void; onSubmit: (order: CoffeeOrderInput) => Promise<void>; onRefresh: () => Promise<void>;
}) {
  const theme = useTheme();
  const [selected, setSelected] = useState<number[]>(() => draft.submitted?.optionIds ?? item.optionGroups.flatMap(group =>
    group.selection === 'single' ? group.options.filter(option => option.isDefault && option.available).map(option => option.id) : []));
  const [note, setNote] = useState(draft.submitted?.note ?? '');
  const [fulfilment, setFulfilment] = useState<'delivery' | 'pickup' | undefined>(draft.submitted?.fulfilment);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const frozen = draft.uncertain || busy;
  const validSelected = selected.filter(id => item.optionGroups.some(group => group.options.some(option => option.id === id && option.available)));
  const requiredMissing = item.optionGroups.some(group => group.required && !group.options.some(option => option.available && selected.includes(option.id)));
  const disabled = busy || !online || (!draft.uncertain && (!item.available || requiredMissing || validSelected.length > 12 || (chooseFulfilment && !fulfilment)));
  const price = item.priceCents + item.optionGroups.flatMap(group => group.options).reduce((sum, option) => sum + (validSelected.includes(option.id) ? option.priceDeltaCents : 0), 0);
  async function submit() {
    if (disabled || submitting.current) return;
    submitting.current = true;
    setError('');
    try {
      await onSubmit(draft.submitted ?? { itemId: item.id, optionIds: validSelected, idempotencyKey: draft.key,
        ...(note.trim() ? { note: note.trim() } : {}), ...(chooseFulfilment && fulfilment ? { fulfilment } : {}) });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not place your order.'); }
    finally { submitting.current = false; }
  }
  function toggle(groupId: number, optionId: number, single: boolean) {
    if (frozen) return;
    const group = item.optionGroups.find(value => value.id === groupId)!;
    setSelected(previous => single ? [...previous.filter(id => !group.options.some(option => option.id === id)), optionId]
      : previous.includes(optionId) ? previous.filter(id => id !== optionId) : [...previous, optionId]);
  }
  return <Modal visible transparent animationType="slide" onRequestClose={() => { if (!busy) onClose(); }}>
    <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={[styles.sheet, { backgroundColor: theme.background }]} edges={['top', 'bottom', 'left', 'right']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <ThemedText accessibilityRole="header" style={styles.title}>{item.name}</ThemedText>
          <Pressable accessibilityRole="button" accessibilityLabel="Close drink options" disabled={busy} onPress={onClose} style={styles.close}>
            <ThemedText themeColor="primary">Close</ThemedText>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <ThemedText type="small" themeColor="textSecondary">{item.description}</ThemedText>
          {draft.uncertain ? <View style={[styles.notice, { backgroundColor: theme.primarySoft }]}>
            <ThemedText accessibilityLiveRegion="polite" type="small">The response was interrupted. Your order may already be in the queue. Retry this same request to confirm it; this will not create a second order.</ThemedText>
          </View> : null}
          {!item.available && !draft.uncertain ? <ThemedText type="small" themeColor="danger">This drink is no longer available.</ThemedText> : null}
          {item.optionGroups.map(group => <View key={group.id} style={styles.group}>
            <ThemedText accessibilityRole="header" type="smallBold">{group.name}{group.required ? ' · required' : ' · optional'}</ThemedText>
            {group.options.map(option => {
              const checked = option.available && selected.includes(option.id);
              return <Pressable key={option.id} accessibilityRole={group.selection === 'single' ? 'radio' : 'checkbox'}
                accessibilityLabel={`${option.label}${!option.available ? ', unavailable' : ''}`}
                accessibilityState={{ checked, disabled: frozen || !option.available }} disabled={frozen || !option.available}
                onPress={() => toggle(group.id, option.id, group.selection === 'single')}
                style={[styles.option, { backgroundColor: checked ? theme.primarySoft : theme.backgroundElement, borderColor: checked ? theme.primary : theme.border }, !option.available && styles.dim]}>
                <ThemedText style={styles.optionText}>{checked ? '✓  ' : ''}{option.label}{!option.available ? ' · unavailable' : ''}</ThemedText>
                {paid && option.priceDeltaCents !== 0 ? <ThemedText type="small">{coffeeMoney(option.priceDeltaCents)}</ThemedText> : null}
              </Pressable>;
            })}
            {!group.required && group.selection === 'single' ? <Pressable accessibilityRole="radio" accessibilityLabel={`No ${group.name.toLowerCase()}`} accessibilityState={{ checked: !group.options.some(option => selected.includes(option.id)), disabled: frozen }} disabled={frozen}
              onPress={() => setSelected(previous => previous.filter(id => !group.options.some(option => option.id === id)))} style={styles.textButton}>
              <ThemedText type="small" themeColor="primary">No {group.name.toLowerCase()}</ThemedText>
            </Pressable> : null}
          </View>)}
          {chooseFulfilment ? <View style={styles.group}>
            <ThemedText accessibilityRole="header" type="smallBold">Delivery or pickup · required</ThemedText>
            {(['delivery', 'pickup'] as const).map(value => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: fulfilment === value, disabled: frozen }} disabled={frozen}
              onPress={() => setFulfilment(value)} style={[styles.option, { backgroundColor: fulfilment === value ? theme.primarySoft : theme.backgroundElement, borderColor: theme.border }]}>
              <ThemedText>{fulfilment === value ? '✓  ' : ''}{value === 'delivery' ? 'Deliver to my committee room' : 'Pick up at the coffee bar'}</ThemedText>
            </Pressable>)}
          </View> : null}
          <View style={styles.group}>
            <ThemedText type="smallBold">Note · optional</ThemedText>
            <TextInput accessibilityLabel="Drink note, up to 60 characters" multiline maxLength={60} value={note} onChangeText={setNote} editable={!frozen}
              placeholder="Anything the barista should know?" placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border }]} />
            <ThemedText type="small" themeColor="textSecondary">{note.length}/60</ThemedText>
          </View>
          {paid ? <ThemedText type="small" themeColor="textSecondary">{free ? 'Your next drink uses your one free drink for the whole conference.' : `Estimated total ${coffeeMoney(price)}. Pay at the counter in the foyer.`} The final price is confirmed when the order is placed. Cash only for paid drinks.</ThemedText> : null}
          {error ? <ThemedText accessibilityRole="alert" type="small" themeColor="danger">{error}</ThemedText> : null}
          {!online ? <Pressable accessibilityRole="button" onPress={() => void onRefresh()} style={styles.textButton}>
            <ThemedText themeColor="primary">Check connection and refresh</ThemedText>
          </Pressable> : null}
          {validSelected.length > 12 ? <ThemedText type="small" themeColor="textSecondary">Select at most 12 options.</ThemedText> : null}
          {requiredMissing && !draft.uncertain ? <ThemedText type="small" themeColor="textSecondary">Choose an available option in each required group.</ThemedText> : null}
          <Pressable accessibilityRole="button" accessibilityState={{ disabled, busy }} disabled={disabled} onPress={() => void submit()}
            style={[styles.submit, { backgroundColor: disabled ? theme.disabledBackground : theme.primary }]}>
            <ThemedText type="smallBold" style={{ color: disabled ? theme.disabledText : theme.onPrimary }}>{busy ? 'Confirming order…' : draft.uncertain ? 'Retry same order' : 'Place order'}</ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  </Modal>;
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { width: '100%', maxWidth: 640, maxHeight: '90%', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 8, borderBottomWidth: 1 },
  title: { fontSize: 20, lineHeight: 27, fontWeight: '500', flex: 1 },
  close: { minHeight: 48, minWidth: 48, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, gap: 20, paddingBottom: 28 },
  group: { gap: 8 },
  option: { minHeight: 48, borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionText: { flex: 1, fontSize: 15, lineHeight: 22 },
  input: { minHeight: 80, padding: 12, borderRadius: 12, borderWidth: 1, fontSize: 16, textAlignVertical: 'top' },
  textButton: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 4 },
  submit: { minHeight: 52, padding: 14, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  notice: { borderRadius: 12, padding: 14 },
  dim: { opacity: 0.55 },
});
