import { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

export function usePadletPoll(refresh: () => Promise<void>, enabled = true) {
 const latest = useRef(refresh);
 useEffect(() => { latest.current = refresh; }, [refresh]);
 useFocusEffect(useCallback(() => {
  if (!enabled) return;
  let active = true;
  let running = false;
  const poll = async () => {
   if (!active || running || AppState.currentState === 'background' || AppState.currentState === 'inactive' || (Platform.OS === 'web' && document.hidden)) return;
   running = true;
   try { await latest.current(); } catch { /* Retry quietly on the next tick. */ }
   finally { running = false; }
  };
  const timer = setInterval(() => void poll(), 2000);
  const subscription = AppState.addEventListener('change', state => { if (state === 'active') void poll(); });
  const visible = () => { if (!document.hidden) void poll(); };
  if (Platform.OS === 'web') document.addEventListener('visibilitychange', visible);
  return () => {
   active = false;
   clearInterval(timer);
   subscription.remove();
   if (Platform.OS === 'web') document.removeEventListener('visibilitychange', visible);
  };
 }, [enabled]));
}
