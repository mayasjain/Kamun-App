import { supabase } from '@/lib/supabase';
import { AccessExpiredError, accessHasExpired, functionErrorReason } from '@/lib/function-errors';
import type { State } from '@/lib/coffee-types';

export type CoffeeOrderInput = { itemId: number; optionIds: number[]; idempotencyKey: string; note?: string; fulfilment?: 'delivery' | 'pickup' };
export type CoffeeAction = { action: 'state'; query?: { v?: string; b?: string } }
  | { action: 'place_order'; order: CoffeeOrderInput }
  | { action: 'cancel_order'; orderId: number };
export type CoffeeStateResponse = State | { unchanged: true; version: number; boundary: string; nextBoundaryAt: string | null };
export class CoffeeError extends Error {
  constructor(public code: string, public uncertain = false) { super(coffeeErrorMessage(code)); }
}
const messages: Record<string, string> = {
  unassigned: 'Your account has no committee assigned. Please contact Logistics.',
  ordering_closed: 'Ordering is closed right now. Check the opening information and try again later.',
  queue_closed: 'The queue is closed. Please wait for the next round.',
  round_full: 'This round just filled up. Please wait for the next round.',
  chairs_paused: 'The chairs’ queue is paused. Please try again shortly.',
  limit_reached: 'Your drink is already on its way. Wait until it is complete before ordering again.',
  daily_limit_reached: 'You have reached today’s order limit.',
  rate_limited: 'Please wait a moment before placing another order.',
  item_unavailable: 'This drink is no longer available. Refresh the menu and choose another.',
  option_invalid: 'Please review your drink options and choose again.',
  option_unavailable: 'One of your options is no longer available. Please choose another.',
  fulfilment_required: 'Choose delivery or pickup before ordering.',
  note_too_long: 'Keep your note to 60 characters or fewer.',
  not_cancellable: 'This order can no longer be cancelled. Its latest status will appear below.',
  conflict: 'The queue changed while ordering. Please refresh and try again.',
  invalid_input: 'Please review your drink options and try again.',
  data_purged: 'Coffee ordering has ended and participant records have been removed.',
  unavailable: 'Coffee ordering could not be reached. Check your connection and try again.',
};
export function coffeeErrorMessage(code: string) { return messages[code] ?? messages.unavailable; }

export async function coffeeRequest<T>(conferenceId: string, action: CoffeeAction): Promise<T> {
  if (!supabase) throw new CoffeeError('unavailable');
  let response;
  try {
    response = await supabase.functions.invoke('ecg-coffee', { body: { conferenceId, ...action }, timeout: 12_000 });
  } catch { throw new CoffeeError('unavailable', action.action !== 'state'); }
  const { data, error } = response;
  if (error || data?.error) {
    const reason = await functionErrorReason(data, error);
    if (accessHasExpired(reason)) throw new AccessExpiredError('Your coffee access has changed. Sign in again with your current KAMUN code.');
    const code = reason && reason in messages ? reason : 'unavailable';
    throw new CoffeeError(code, code === 'unavailable' && action.action !== 'state');
  }
  if (!data || typeof data !== 'object') throw new CoffeeError('unavailable', action.action !== 'state');
  if (action.action === 'place_order' && (!data.order || !Number.isSafeInteger(data.order.id) || data.order.id < 1 || typeof data.order.dayCode !== 'string'))
    throw new CoffeeError('unavailable', true);
  if (action.action === 'cancel_order' && data.ok !== true) throw new CoffeeError('unavailable', true);
  if (action.action === 'state' && typeof data.unchanged !== 'boolean') throw new CoffeeError('unavailable');
  return data as T;
}

export function newCoffeeRequestKey(): string {
  const bytes = new Uint8Array(16);
  // This UUID deduplicates submissions; it is never an authentication credential.
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
