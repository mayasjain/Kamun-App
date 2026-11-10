import type { Order } from './coffee-types';

/** One foreground alert per ready transition; dismissing never changes the actual order. */
export function createCoffeeReadyTracker() {
  let initialized = false;
  let previous = new Set<number>();
  const dismissed = new Set<number>();
  return {
    update(orders: readonly Order[]) {
      const ready = orders.filter(order => order.status === 'ready');
      const ids = new Set(ready.map(order => order.id));
      for (const id of dismissed) if (!ids.has(id)) dismissed.delete(id);
      const newlyReady = initialized ? ready.filter(order => !previous.has(order.id)) : [];
      initialized = true;
      previous = ids;
      return { visible: ready.filter(order => !dismissed.has(order.id)), newlyReady };
    },
    dismiss(ids: readonly number[]) { ids.forEach(id => dismissed.add(id)); },
    reset() { initialized = false; previous.clear(); dismissed.clear(); },
  };
}
