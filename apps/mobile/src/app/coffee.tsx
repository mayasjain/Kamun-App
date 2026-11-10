import { useRef, useState } from 'react';
import { Link } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { CoffeeOrderSheet, type CoffeeDraft } from '@/components/coffee-order-sheet';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useAttendeeProfile } from '@/contexts/attendee-profile';
import { useCoffee } from '@/hooks/use-coffee';
import { useTheme } from '@/hooks/use-theme';
import { CoffeeError, newCoffeeRequestKey, type CoffeeOrderInput } from '@/lib/coffee-client';
import { activeCoffeeOrder, coffeeBlockedReason, coffeeMoney, coffeeOpening, coffeeOrderStatus } from '@/lib/coffee-display';
import type { MenuItem, Order } from '@/lib/coffee-types';

export default function CoffeeScreen() {
  const { profile } = useAttendeeProfile();
  if (!profile || profile.accessType === 'admin' || profile.identitySource !== 'ecg') return (
    <Screen compactHeader eyebrow="KAMUN 2026" title="ECE Coffee Bar" subtitle="Your conference coffee bar">
      <ThemedText>{profile?.accessType === 'admin' ? 'Coffee ordering is available to delegates and chairs.' : 'Connect coffee ordering with your personal KAMUN code.'}</ThemedText>
      <Link href="/more" asChild><Pressable accessibilityRole="link" style={styles.textButton}><ThemedText themeColor="primary">Open account and access</ThemedText></Pressable></Link>
    </Screen>
  );
  // A changed access identity remounts the entire coffee session and discards its pending UI.
  return <ConnectedCoffee key={`${profile.conferenceId}:${profile.accessType}:${profile.committeeId}:${profile.seatLabel}:${profile.accessLabel}`} conferenceId={profile.conferenceId} />;
}

function ConnectedCoffee({ conferenceId }: { conferenceId: string }) {
  const theme = useTheme();
  const coffee = useCoffee(conferenceId);
  const [draft, setDraft] = useState<CoffeeDraft | null>(null);
  const [showOrder, setShowOrder] = useState(false);
  const [notice, setNotice] = useState('');
  const cancellationLock = useRef(false);
  const state = coffee.state;
  const blocked = state ? coffeeBlockedReason(state) : null;
  const pending = !!draft?.uncertain;
  const active = state?.me.orders.filter(activeCoffeeOrder) ?? [];
  const history = state?.me.orders.filter(order => !activeCoffeeOrder(order)) ?? [];
  const opening = state ? coffeeOpening(state) : null;
  const card = { backgroundColor: theme.backgroundElement, borderColor: theme.border };
  const queue = state?.me.queue;
  const queueLabel = queue?.kind === 'chairs'
    ? queue.paused ? 'Chairs’ queue paused' : 'Chairs’ queue open'
    : queue?.round?.open ? `Queue open · ${queue.round.remaining} of ${queue.round.capacity} spots left` : queue?.round?.closeReason === 'full' ? 'Round full' : 'Queue closed';

  function startOrder(item: MenuItem) {
    if (coffee.busy || !coffee.online || pending || blocked || !item.available) return;
    try {
      setDraft({ item, key: newCoffeeRequestKey(), uncertain: false });
      setShowOrder(true);
      setNotice('');
    } catch { setNotice('Could not prepare your order. Please reload the app and try again.'); }
  }
  async function submit(order: CoffeeOrderInput) {
    try {
      const result = await coffee.mutate<{ order: { id: number; dayCode: string } }>({ action: 'place_order', order });
      setNotice(`Order #${result.order.dayCode} confirmed.`);
      setDraft(null);
      setShowOrder(false);
    } catch (cause) {
      if (cause instanceof CoffeeError) {
        setDraft(previous => previous ? { ...previous, uncertain: cause.uncertain,
          submitted: cause.uncertain ? order : undefined } : previous);
      }
      throw cause;
    }
  }
  async function cancel(order: Order) {
    if (cancellationLock.current || coffee.busy || !coffee.online) return;
    cancellationLock.current = true;
    try {
      await coffee.mutate({ action: 'cancel_order', orderId: order.id });
      setNotice(`Order #${order.dayCode} cancelled.`);
    } catch { /* The hook displays the error and refreshes the server-confirmed status. */ }
    finally { cancellationLock.current = false; }
  }
  function orderCard(order: Order) {
    return <View key={order.id} style={[styles.card, card, order.status === 'ready' && { borderColor: theme.primary, borderWidth: 2 }]}>
      <View style={styles.orderHeading}>
        <ThemedText type="smallBold" themeColor="primary">#{order.dayCode}</ThemedText>
        <ThemedText accessibilityRole="header" style={styles.orderTitle}>{order.itemName}</ThemedText>
        {state?.settings.paidMode ? <ThemedText type="small">{order.priceCents === 0 ? 'Free' : coffeeMoney(order.priceCents)}</ThemedText> : null}
      </View>
      {order.options.length ? <ThemedText type="small" themeColor="textSecondary">{order.options.map(option => option.label).join(' · ')}</ThemedText> : null}
      {order.note ? <ThemedText type="small" themeColor="textSecondary">Note: {order.note}</ThemedText> : null}
      <ThemedText accessibilityLiveRegion="polite" type="smallBold" themeColor={order.status === 'ready' ? 'primary' : 'text'}>{coffeeOrderStatus(order, state!.settings.barLocationLabel)}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">{order.fulfilment === 'delivery' ? `Delivery${order.roomCode ? ` · Room ${order.roomCode}` : ' to your committee room'}` : `Pickup · ${state!.settings.barLocationLabel}`}</ThemedText>
      {order.status === 'queued' ? <Pressable accessibilityRole="button" accessibilityLabel={`Cancel order ${order.dayCode}`} disabled={!coffee.online || coffee.busy}
        accessibilityState={{ disabled: !coffee.online || coffee.busy }} onPress={() => void cancel(order)} style={styles.textButton}>
        <ThemedText type="smallBold" themeColor="danger">Cancel order</ThemedText>
      </Pressable> : null}
    </View>;
  }
  const sheetItem = draft && state?.menu.find(item => item.id === draft.item.id);
  return <>
    <Screen compactHeader eyebrow="KAMUN 2026" title="ECE Coffee Bar" subtitle="Your next coffee, right here" onRefresh={() => void coffee.refresh()} refreshing={coffee.loading}>
      {coffee.loading && !state ? <View style={styles.loading}><ActivityIndicator color={theme.primary} accessibilityLabel="Loading coffee bar" /><ThemedText type="small">Loading the coffee bar…</ThemedText></View> : null}
      {coffee.error ? <View style={[styles.card, { backgroundColor: theme.primarySoft, borderColor: theme.border }]}>
        <ThemedText accessibilityRole="alert" type="small">{coffee.error}</ThemedText>
        <Pressable accessibilityRole="button" onPress={() => void coffee.refresh()} style={styles.textButton}><ThemedText type="smallBold" themeColor="primary">Refresh coffee bar</ThemedText></Pressable>
      </View> : null}
      {notice ? <ThemedText accessibilityLiveRegion="polite" type="small" themeColor="primary">{notice}</ThemedText> : null}
      {state ? <>
        <View style={[styles.card, { backgroundColor: theme.primarySoft, borderColor: theme.border }]}>
          <ThemedText accessibilityRole="header" style={styles.heading} themeColor="primary">{opening!.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">{opening!.detail}</ThemedText>
          <ThemedText type="smallBold" themeColor="primary">{queueLabel}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">{state.me.person.committee?.short} · {state.me.person.role}{state.me.person.room ? ` · Room ${state.me.person.room.code}` : ''}</ThemedText>
          {state.me.dailyLimit !== null ? <ThemedText type="small" themeColor="textSecondary">{Math.max(0, state.me.dailyLimit - state.me.dailyCount)} of {state.me.dailyLimit} orders left today</ThemedText> : null}
          {state.settings.bannerText ? <ThemedText type="small">{state.settings.bannerText}</ThemedText> : null}
        </View>
        {pending ? <View style={[styles.card, card]}>
          <ThemedText type="small">Your last submission needs confirmation. Review it before starting another order.</ThemedText>
          <Pressable accessibilityRole="button" onPress={() => setShowOrder(true)} style={styles.textButton}><ThemedText type="smallBold" themeColor="primary">Review pending order</ThemedText></Pressable>
        </View> : null}
        {active.length ? <View style={styles.section}><ThemedText accessibilityRole="header" style={styles.heading}>Your {active.length === 1 ? 'order' : 'orders'}</ThemedText>{active.map(orderCard)}</View> : null}
        <View style={styles.section}>
          <ThemedText accessibilityRole="header" style={styles.heading}>Menu</ThemedText>
          {state.settings.paidMode ? <ThemedText type="small" themeColor="textSecondary">{state.me.freeLeftToday !== null && state.me.freeLeftToday > 0 ? `${state.me.freeLeftToday} free ${state.me.freeLeftToday === 1 ? 'drink' : 'drinks'} left today. ` : ''}Prices are confirmed when ordering. Pay at the counter in the foyer.</ThemedText> : null}
          {blocked ? <ThemedText type="small" themeColor="textSecondary">{blocked}</ThemedText> : null}
          {!state.menu.length ? <ThemedText type="small" themeColor="textSecondary">The menu is being prepared. Check back shortly.</ThemedText> : null}
          {state.menu.map(item => {
            const disabled = !coffee.online || coffee.busy || pending || !!blocked || !item.available;
            return <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.name}${!item.available ? ', unavailable' : ''}`} accessibilityState={{ disabled }} disabled={disabled} onPress={() => startOrder(item)}
              style={({ pressed }) => [styles.menuItem, card, pressed && styles.pressed]}>
              <View style={styles.menuCopy}><ThemedText style={styles.menuTitle}>{item.name}</ThemedText><ThemedText type="small" themeColor="textSecondary">{item.description}</ThemedText></View>
              <View style={styles.menuAction}>
                {state.settings.paidMode ? <ThemedText type="smallBold">{coffeeMoney(item.priceCents)}</ThemedText> : null}
                <ThemedText type="smallBold" style={{ color: disabled ? theme.textSecondary : theme.primary }}>{!item.available ? 'Unavailable' : 'Order'}</ThemedText>
              </View>
            </Pressable>;
          })}
        </View>
        {state.me.tabCents !== null ? <View style={[styles.card, card]}><ThemedText type="smallBold">Outstanding balance · {coffeeMoney(state.me.tabCents)}</ThemedText><ThemedText type="small" themeColor="textSecondary">Payments are recorded at the counter in the foyer.</ThemedText></View> : null}
        {history.length ? <View style={styles.section}><ThemedText accessibilityRole="header" style={styles.heading}>Earlier orders</ThemedText>{history.map(orderCard)}</View> : null}
        <ThemedText type="small" themeColor="textSecondary" style={styles.credit}>Coffee brewed by {state.settings.baristaName}</ThemedText>
      </> : null}
    </Screen>
    {draft && showOrder && state ? <CoffeeOrderSheet key={draft.key} draft={draft} item={sheetItem ?? { ...draft.item, available: false }} paid={state.settings.paidMode}
      free={state.me.freeLeftToday !== null && state.me.freeLeftToday > 0} chooseFulfilment={state.schedule.current?.fulfilment === 'either'}
      online={coffee.online} busy={coffee.busy} onClose={() => setShowOrder(false)} onSubmit={submit} onRefresh={coffee.refresh} /> : null}
  </>;
}
const styles = StyleSheet.create({
  textButton: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 4 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 8 },
  section: { gap: 12 },
  heading: { fontSize: 19, lineHeight: 26, fontWeight: '500' },
  orderHeading: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  orderTitle: { flex: 1, minWidth: 100, fontSize: 17, lineHeight: 24, fontWeight: '500' },
  menuItem: { borderWidth: 1, borderRadius: 18, minHeight: 88, padding: 16, gap: 12, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  menuCopy: { flex: 1, minWidth: 150, gap: 5 },
  menuTitle: { fontSize: 16, lineHeight: 23, fontWeight: '500' },
  menuAction: { minWidth: 68, alignItems: 'flex-end', gap: 6 },
  loading: { alignItems: 'center', paddingVertical: 24, gap: 16 },
  credit: { textAlign: 'center', fontSize: 12 },
  pressed: { opacity: 0.7 },
});
