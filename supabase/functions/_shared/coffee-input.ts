export type CoffeeAction =
  | { action: 'state'; query?: { v?: string; b?: string } }
  | { action: 'place_order'; order: { itemId: number; optionIds: number[]; idempotencyKey: string; note?: string; fulfilment?: 'delivery' | 'pickup' } }
  | { action: 'cancel_order'; orderId: number };
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const positive = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) > 0;
const keys = (v: Record<string, unknown>, allowed: string[]) => Object.keys(v).every(key => allowed.includes(key));

/** Only validated participant actions cross the server boundary. Actor and price are never input. */
export function parseCoffeeInput(value: unknown): ({ conferenceId: string } & CoffeeAction) | null {
  if (!object(value) || typeof value.conferenceId !== 'string'
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.conferenceId)) return null;
  const conferenceId = value.conferenceId;
  if (value.action === 'state' && keys(value, ['conferenceId', 'action', 'query'])) {
    if (value.query === undefined) return { conferenceId, action: 'state' };
    if (!object(value.query) || !keys(value.query, ['v', 'b'])) return null;
    const { v, b } = value.query;
    if ((v !== undefined && (typeof v !== 'string' || v.length > 30))
      || (b !== undefined && (typeof b !== 'string' || b.length > 300))) return null;
    return { conferenceId, action: 'state', query: { ...(typeof v === 'string' ? { v } : {}), ...(typeof b === 'string' ? { b } : {}) } };
  }
  if (value.action === 'cancel_order' && keys(value, ['conferenceId', 'action', 'orderId']) && positive(value.orderId))
    return { conferenceId, action: 'cancel_order', orderId: value.orderId };
  if (value.action !== 'place_order' || !keys(value, ['conferenceId', 'action', 'order']) || !object(value.order)) return null;
  const order = value.order;
  if (!keys(order, ['itemId', 'optionIds', 'note', 'idempotencyKey', 'fulfilment'])
    || !positive(order.itemId) || !Array.isArray(order.optionIds) || order.optionIds.length > 12 || !order.optionIds.every(positive)
    || typeof order.idempotencyKey !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(order.idempotencyKey)
    || (order.note !== undefined && (typeof order.note !== 'string' || order.note.length > 500))
    || (order.fulfilment !== undefined && order.fulfilment !== 'delivery' && order.fulfilment !== 'pickup')) return null;
  return { conferenceId, action: 'place_order', order: { itemId: order.itemId, optionIds: order.optionIds as number[],
    idempotencyKey: order.idempotencyKey, ...(typeof order.note === 'string' ? { note: order.note } : {}),
    ...(order.fulfilment ? { fulfilment: order.fulfilment as 'delivery' | 'pickup' } : {}) } };
}
