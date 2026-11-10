import type { Order, State } from './coffee-types';

export const activeCoffeeOrder = (order: Order) => ['queued', 'preparing', 'ready'].includes(order.status);
export const coffeeMoney = (cents: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(cents / 100);

/** Advisory only: ECE enforces all limits, schedule and prices atomically on submission. */
export function coffeeBlockedReason(state: State): string | null {
  const me = state.me;
  if (!me.person.committee) return 'Your committee is not assigned yet. Please contact Logistics.';
  if (me.activeLimit !== null && me.activeCount >= me.activeLimit) return 'Your drink is on its way. You can order again once it is complete.';
  if (me.dailyLimit !== null && me.dailyCount >= me.dailyLimit) return 'You have reached today’s order limit.';
  if (me.queue.kind === 'chairs') return me.queue.paused ? 'The chairs’ queue is paused for a moment.' : null;
  if (me.queue.round?.open) return null;
  return me.queue.round?.closeReason === 'full' ? 'This round is full. Please wait for the next round.' : 'Ordering is closed. The bar opens the queue in rounds.';
}
export function coffeeOrderStatus(order: Order, bar: string) {
  switch (order.status) {
    case 'queued': return order.ahead === null ? 'In the queue' : `${order.ahead} ${order.ahead === 1 ? 'drink' : 'drinks'} before yours`;
    case 'preparing': return 'Your drink is being made';
    case 'ready': return order.fulfilment === 'delivery' ? 'Ready · waiting for a runner' : `Ready · collect at ${bar}`;
    case 'delivered': return 'Delivered to your room';
    case 'picked_up': return 'Picked up';
    case 'cancelled': return order.cancelReason ? `Cancelled · ${order.cancelReason}` : 'Cancelled';
  }
}
export function coffeeOpening(state: State) {
  const current = state.schedule.current;
  const next = state.schedule.blocks.find(block => block.fulfilment !== 'none'
    && (block.day > state.nowLocal.day || (block.day === state.nowLocal.day && block.start > state.nowLocal.time)));
  if (current && current.fulfilment !== 'none') {
    const how = current.fulfilment === 'delivery' ? 'Delivery to your committee room'
      : current.fulfilment === 'pickup' ? `Pickup at ${state.settings.barLocationLabel}` : 'Choose delivery or pickup';
    return { title: current.label, detail: `Until ${current.end} · ${how}` };
  }
  if (next) return { title: current?.label ?? 'Next opening', detail: `Next: ${next.day} at ${next.start} · ${next.label}` };
  return { title: 'Coffee bar closed', detail: 'There are no more scheduled openings.' };
}
