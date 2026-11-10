import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { useAttendeeProfile } from '@/contexts/attendee-profile';
import { coffeeRequest, CoffeeError, type CoffeeAction, type CoffeeStateResponse } from '@/lib/coffee-client';
import { createCoffeeReadyTracker } from '@/lib/coffee-ready';
import { signalCoffeeReady } from '@/lib/coffee-ready-signal';
import { activeCoffeeOrder } from '@/lib/coffee-display';
import { AccessExpiredError } from '@/lib/function-errors';
import type { Order, State } from '@/lib/coffee-types';

export function useCoffee(conferenceId: string) {
  const { clearProfile } = useAttendeeProfile();
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [readyTracker] = useState(createCoffeeReadyTracker);
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const current = useRef<State | null>(null);
  const active = useRef(false);
  const readVersion = useRef(0);
  const locked = useRef(false);
  const due = useRef(0);
  const clockOffset = useRef(0);
  const visible = () => AppState.currentState !== 'background' && AppState.currentState !== 'inactive'
    && (typeof document === 'undefined' || document.visibilityState !== 'hidden');
  const refresh = useCallback(async (force = false) => {
    if (!active.current || !visible()) return;
    const version = ++readVersion.current;
    due.current = Infinity;
    const saved = current.current;
    let succeeded = false;
    try {
      const query = !force && saved ? { v: String(saved.version), b: saved.boundary } : undefined;
      const data = await coffeeRequest<CoffeeStateResponse>(conferenceId, { action: 'state', ...(query ? { query } : {}) });
      if (!active.current || version !== readVersion.current) return;
      if (data.unchanged) {
        if (!saved) throw new CoffeeError('unavailable');
        current.current = { ...saved, nextBoundaryAt: data.nextBoundaryAt };
      } else {
        if (!data.me || !Array.isArray(data.me.orders) || !Array.isArray(data.menu) || !data.schedule || !data.settings)
          throw new CoffeeError('unavailable');
        current.current = data;
        const alerts = readyTracker.update(data.me.orders);
        setReadyOrders(alerts.visible);
        if (alerts.newlyReady.length) void signalCoffeeReady(() => active.current && visible());
        clockOffset.current = Date.parse(data.now) - Date.now();
      }
      setState(current.current);
      succeeded = true;
      setOnline(true);
      setError('');
    } catch (cause) {
      if (!active.current || version !== readVersion.current) return;
      setOnline(false);
      setError(cause instanceof Error ? cause.message : 'Could not refresh coffee ordering.');
      if (cause instanceof AccessExpiredError) { current.current = null; setState(null); setReadyOrders([]); readyTracker.reset(); clearProfile(); }
      if (cause instanceof CoffeeError && cause.code === 'data_purged') { current.current = null; setState(null); setReadyOrders([]); readyTracker.reset(); }
    } finally {
      if (active.current && version === readVersion.current) {
        setLoading(false);
        const savedState = current.current;
        const interval = succeeded && savedState?.me.orders.some(activeCoffeeOrder) ? 5_000 : 30_000;
        const boundary = succeeded && savedState?.nextBoundaryAt ? Date.parse(savedState.nextBoundaryAt) - clockOffset.current + 1000 : Infinity;
        due.current = Math.max(Date.now() + 1000, Math.min(Date.now() + interval, boundary));
      }
    }
  }, [conferenceId, clearProfile, readyTracker]);

  useFocusEffect(useCallback(() => {
    active.current = true;
    void refresh(true);
    const timer = setInterval(() => { if (visible() && Date.now() >= due.current) void refresh(); }, 1000);
    const resume = () => { if (visible()) void refresh(true); };
    const offline = () => {
      if (!active.current) return;
      readVersion.current++;
      setOnline(false);
      setLoading(false);
      setError('You are offline. Reconnect and refresh before ordering.');
      due.current = Date.now() + 30_000;
    };
    const appState = AppState.addEventListener('change', resume);
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', resume);
    if (typeof window !== 'undefined') { window.addEventListener('online', resume); window.addEventListener('offline', offline); }
    return () => {
      active.current = false;
      readVersion.current++;
      clearInterval(timer);
      appState.remove();
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', resume);
      if (typeof window !== 'undefined') { window.removeEventListener('online', resume); window.removeEventListener('offline', offline); }
    };
  }, [refresh]));

  async function mutate<T>(action: Exclude<CoffeeAction, { action: 'state' }>): Promise<T> {
    if (locked.current || !active.current || !online || !visible() || (typeof navigator !== 'undefined' && navigator.onLine === false)) throw new CoffeeError('unavailable');
    locked.current = true;
    setBusy(true);
    setActionError('');
    try {
      return await coffeeRequest<T>(conferenceId, action);
    } catch (cause) {
      if (active.current) {
        setActionError(cause instanceof Error ? cause.message : 'Coffee ordering could not be reached.');
        if (cause instanceof AccessExpiredError) { current.current = null; setState(null); setReadyOrders([]); readyTracker.reset(); clearProfile(); }
        if (cause instanceof CoffeeError && cause.uncertain) setOnline(false);
      }
      throw cause;
    } finally {
      if (active.current) await refresh(true);
      setBusy(false);
      locked.current = false;
    }
  }
  function dismissReady() {
    readyTracker.dismiss(readyOrders.map(order => order.id));
    setReadyOrders([]);
  }
  return { state, readyOrders, dismissReady, error: actionError || error, online, loading, busy, refresh: () => { setActionError(''); setLoading(true); return refresh(true); }, mutate };
}
