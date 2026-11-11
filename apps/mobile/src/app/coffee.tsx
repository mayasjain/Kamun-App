import { useRef, useState } from 'react';
import { Link } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { CoffeeDrinkIcon } from '@/components/coffee-drink-icon';
import { CoffeeOrderProgress } from '@/components/coffee-order-progress';
import { CoffeeSchedule } from '@/components/coffee-schedule';
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
  const { width, fontScale } = useWindowDimensions();
  const compactMenu = width < 480 || fontScale > 1.2;
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
      <CoffeeOrderProgress order={order} />
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
      {state && coffee.readyOrders.length ? <View style={[styles.readyBanner, { backgroundColor: theme.primary }]}>
        <ThemedText accessibilityRole="header" accessibilityLiveRegion="polite" style={[styles.heading, { color: theme.onPrimary }]}>{coffee.readyOrders.length === 1 ? `Order #${coffee.readyOrders[0].dayCode} is ready!` : `${coffee.readyOrders.length} orders are ready!`}</ThemedText>
        {coffee.readyOrders.map(order => <ThemedText key={order.id} type="small" style={{ color: theme.onPrimary }}>#{order.dayCode} · {order.itemName}{'\n'}{coffeeOrderStatus(order, state.settings.barLocationLabel)}</ThemedText>)}
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss ready alert" onPress={coffee.dismissReady} style={styles.textButton}><ThemedText type="smallBold" style={{ color: theme.onPrimary }}>Dismiss alert</ThemedText></Pressable>
      </View> : null}
      {state ? <>
        <View style={[styles.card, styles.overviewCard, card]}>
          <ThemedText style={styles.eyebrow} themeColor="textSecondary">YOU ARE</ThemedText>
          <ThemedText accessibilityRole="header" style={styles.overviewTitle} themeColor="primary">{[state.me.person.committee?.short, state.me.person.role].filter(Boolean).join(' · ')}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">{state.me.person.room ? [`Room ${state.me.person.room.code}`, state.me.person.room.building].filter(Boolean).join(' · ') : 'Room not assigned yet'}</ThemedText>
        </View>
        <View style={[styles.card, styles.overviewCard, card]}>
          <ThemedText style={styles.eyebrow} themeColor="textSecondary">{opening!.eyebrow.toUpperCase()}</ThemedText>
          <ThemedText accessibilityRole="header" style={styles.overviewTitle} themeColor="primary">{opening!.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">{opening!.detail}</ThemedText>
        </View>
        <View style={styles.queueStatus}>
          <View accessible={false} style={[styles.queueDot, { backgroundColor: blocked ? theme.textSecondary : theme.primary }]} />
          <ThemedText type="small" themeColor="textSecondary" accessibilityLiveRegion="polite">{queueLabel}</ThemedText>
        </View>
        <View style={styles.section}>
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
          {state.settings.paidMode ? <View style={[styles.allowanceNotice, { backgroundColor: theme.primarySoft, borderColor: theme.border }]}>
            <ThemedText accessibilityRole="header" style={styles.allowanceTitle} themeColor="primary">One free coffee bar drink per person</ThemedText>
            <ThemedText type="small" themeColor="primary">One free coffee bar drink per person for the whole conference. After that, menu prices apply.</ThemedText>
            <ThemedText type="small" themeColor="primary" style={styles.paymentInfo}>
              Cash only — Pay at the counter in the foyer.
            </ThemedText>
          </View> : null}
          {blocked ? <ThemedText type="small" themeColor="textSecondary">{blocked}</ThemedText> : null}
          {!state.menu.length ? <ThemedText type="small" themeColor="textSecondary">The menu is being prepared. Check back shortly.</ThemedText> : null}
          {state.menu.map(item => {
            const disabled = !coffee.online || coffee.busy || pending || !!blocked || !item.available;
            return <View key={item.id} style={[styles.menuItem, card]}>
              <View style={[styles.drinkIcon, { backgroundColor: theme.background }]} accessible={false}>
                <CoffeeDrinkIcon name={item.name} emoji={item.emoji} />
              </View>
              <View style={styles.menuBody}>
                <View style={styles.menuTopline}>
                  <ThemedText style={styles.menuTitle}>{item.name}</ThemedText>
                  {state.settings.paidMode ? <ThemedText style={styles.menuPrice}>{coffeeMoney(item.priceCents)}</ThemedText> : null}
                </View>
                <ThemedText type="small" themeColor="textSecondary">{item.description}</ThemedText>
                {compactMenu ? <Pressable accessibilityRole="button" accessibilityLabel={`Order ${item.name}`} accessibilityState={{ disabled }} disabled={disabled} onPress={() => startOrder(item)}
                  style={({ pressed }) => [styles.orderPill, styles.orderPillCompact, { backgroundColor: disabled ? theme.disabledBackground : theme.primary }, pressed && styles.pressed]}>
                  <ThemedText type="smallBold" style={{ color: disabled ? theme.disabledText : theme.onPrimary }}>{!item.available ? 'Unavailable' : 'Order'}</ThemedText>
                </Pressable> : null}
              </View>
              {!compactMenu ? <Pressable accessibilityRole="button" accessibilityLabel={`Order ${item.name}`} accessibilityState={{ disabled }} disabled={disabled} onPress={() => startOrder(item)}
                style={({ pressed }) => [styles.orderPill, { backgroundColor: disabled ? theme.disabledBackground : theme.primary }, pressed && styles.pressed]}>
                <ThemedText type="smallBold" style={{ color: disabled ? theme.disabledText : theme.onPrimary }}>{!item.available ? 'Unavailable' : 'Order'}</ThemedText>
              </Pressable> : null}
            </View>;
          })}
          {[
            { name: 'Black coffee', emoji: '☕', description: 'Free black coffee in the foyer during the coffee breaks.' },
            { name: 'Hot tea', emoji: '🫖', description: 'Free hot tea with tea bags in the foyer during the coffee breaks.' },
          ].map(item => <View key={item.name} style={[styles.menuItem, card]}>
            <View style={[styles.drinkIcon, { backgroundColor: theme.background }]} accessible={false}>
              <CoffeeDrinkIcon name={item.name} emoji={item.emoji} />
            </View>
            <View style={styles.menuBody}>
              <View style={styles.menuTopline}>
                <ThemedText style={styles.menuTitle}>{item.name}</ThemedText>
                <View style={[styles.freeBadge, { backgroundColor: theme.primarySoft }]}>
                  <ThemedText style={styles.freeBadgeText} themeColor="primary">FREE</ThemedText>
                </View>
              </View>
              <ThemedText type="small" themeColor="textSecondary">{item.description}</ThemedText>
              {compactMenu ? <View style={[styles.orderPill, styles.orderPillCompact, { backgroundColor: theme.primarySoft }]}>
                <ThemedText type="smallBold" themeColor="primary">In foyer</ThemedText>
              </View> : null}
            </View>
            {!compactMenu ? <View style={[styles.orderPill, { backgroundColor: theme.primarySoft }]}>
              <ThemedText type="smallBold" themeColor="primary">In foyer</ThemedText>
            </View> : null}
          </View>)}
        </View>
        {state.me.tabCents !== null ? <View style={[styles.card, card]}><ThemedText type="smallBold">Outstanding balance · {coffeeMoney(state.me.tabCents)}</ThemedText><ThemedText type="small" themeColor="textSecondary">Cash only · Pay at the counter in the foyer.</ThemedText></View> : null}
        {history.length ? <View style={styles.section}><ThemedText accessibilityRole="header" style={styles.heading}>Earlier orders</ThemedText>{history.map(orderCard)}</View> : null}
        <CoffeeSchedule schedule={state.schedule} />
        <View style={styles.credit}>
          <ThemedText accessible={false}>☕</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Coffee brewed by {state.settings.baristaName}</ThemedText>
        </View>
      </> : null}
    </Screen>
    {draft && showOrder && state ? <CoffeeOrderSheet key={draft.key} draft={draft} item={sheetItem ?? { ...draft.item, available: false }} paid={state.settings.paidMode}
      free={state.me.freeLeftToday !== null && state.me.freeLeftToday > 0} chooseFulfilment={state.schedule.current?.fulfilment === 'either'}
      online={coffee.online} busy={coffee.busy} onClose={() => setShowOrder(false)} onSubmit={submit} onRefresh={coffee.refresh} /> : null}
  </>;
}
const styles = StyleSheet.create({
  allowanceNotice: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  allowanceTitle: { fontSize: 17, lineHeight: 24, fontWeight: '600' },
  readyBanner: { borderRadius: 18, padding: 18, gap: 10 },
  textButton: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 4 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 8 },
  overviewCard: { padding: 20, gap: 10 },
  eyebrow: { fontSize: 12, lineHeight: 18, fontWeight: '600', letterSpacing: 2 },
  overviewTitle: { fontSize: 24, lineHeight: 32, fontWeight: '600' },
  queueStatus: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  queueDot: { width: 8, height: 8, borderRadius: 4 },
  section: { gap: 12 },
  heading: { fontSize: 19, lineHeight: 26, fontWeight: '500' },
  orderHeading: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  orderTitle: { flex: 1, minWidth: 100, fontSize: 17, lineHeight: 24, fontWeight: '500' },
  menuItem: { borderWidth: 1, borderRadius: 20, minHeight: 96, padding: 16, gap: 14, flexDirection: 'row', alignItems: 'center' },
  drinkIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  menuBody: { flex: 1, minWidth: 0, gap: 6 },
  menuTopline: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 16, rowGap: 4 },
  menuTitle: { fontSize: 16, lineHeight: 23, fontWeight: '600', flexShrink: 1 },
  menuPrice: { fontSize: 16, lineHeight: 23, fontWeight: '600' },
  paymentInfo: { marginTop: 4 },
  freeBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  freeBadgeText: { fontSize: 11, lineHeight: 16, fontWeight: '600', letterSpacing: 0.6 },
  orderPill: { minHeight: 44, minWidth: 76, borderRadius: 24, paddingHorizontal: 18, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  orderPillCompact: { alignSelf: 'flex-start', marginTop: 4 },
  loading: { alignItems: 'center', paddingVertical: 24, gap: 16 },
  credit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 6 },
  pressed: { opacity: 0.7 },
});
