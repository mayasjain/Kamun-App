import type { Order, State } from './coffee-types';

export const activeCoffeeOrder = (order: Order) => ['queued', 'preparing', 'ready'].includes(order.status);
export const coffeeMoney = (cents: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: cents % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(cents / 100);

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
  const next = coffeeScheduleDays(state.schedule.blocks).flatMap(day => day.blocks).find(block => block.fulfilment !== 'none'
    && (block.day > state.nowLocal.day || (block.day === state.nowLocal.day && block.start > state.nowLocal.time)));
  if (current && current.fulfilment !== 'none') {
    const how = current.fulfilment === 'delivery' ? 'Delivery to your committee room'
      : current.fulfilment === 'pickup' ? `Pickup at ${state.settings.barLocationLabel}` : 'Choose delivery or pickup';
    return { eyebrow: 'Now', title: current.label, detail: `Until ${current.end} · ${how}` };
  }
  if (next) return { eyebrow: 'Next', title: next.label, detail: `${coffeeDayLabel(next.day)} at ${next.start}` };
  return { eyebrow: 'Coffee Bar', title: 'Coffee bar closed', detail: 'There are no more scheduled openings.' };
}

export function coffeeDayLabel(day: string) {
  const date = new Date(`${day}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? day : new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', day: 'numeric', month: 'short', timeZone: 'Europe/Berlin',
  }).format(date);
}

export function coffeeScheduleDays(blocks: readonly import('./coffee-types').Block[]) {
  const sorted = blocks.filter(block => block.enabled).sort((a, b) => a.day.localeCompare(b.day) || a.start.localeCompare(b.start) || a.id - b.id);
  return [...new Set(sorted.map(block => block.day))].map(day => ({ day, blocks: sorted.filter(block => block.day === day) }));
}

export function coffeeFulfilmentLabel(fulfilment: import('./coffee-types').BlockFulfilment) {
  return { delivery: 'Delivery to committee rooms', pickup: 'Pickup at the coffee bar', either: 'Delivery or pickup', none: 'Closed for ordering' }[fulfilment];
}

export function coffeeProgress(order: Pick<Order, 'status' | 'fulfilment'>) {
  if (order.status === 'cancelled') return null;
  const labels = ['In queue', 'Being made', 'Ready', order.fulfilment === 'delivery' ? 'Delivered' : 'Picked up'];
  const index = { queued: 0, preparing: 1, ready: 2, delivered: 3, picked_up: 3 }[order.status];
  return { labels, index };
}
