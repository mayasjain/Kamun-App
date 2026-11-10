import { supabase } from '@/lib/supabase';
import { KAMUN_CONFERENCE_ID } from '@/lib/conference-id';

async function invoke(body: object) {
  if (!supabase) throw new Error('Notifications are unavailable.');
  const { data, error } = await supabase.functions.invoke('push-subscribe', { body });
  if (error || data?.error) throw new Error('Could not update notifications. Check your connection and try again.');
  return data;
}
export function pushSupport(): 'supported' | 'install' | 'unsupported' {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'unsupported';
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone;
  if (ios && !standalone) return 'install';
  return window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    ? 'supported' : 'unsupported';
}
async function pushRegistration() {
  await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
  return navigator.serviceWorker.ready;
}
export async function pushEnabled() {
  const registration = await pushRegistration();
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription || Notification.permission !== 'granted') return false;
  return (await invoke({ action: 'status', endpoint: subscription.endpoint })).enabled === true;
}
export async function enablePush() {
  // Called directly from the tap handler, before any async work (required on iOS).
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notifications are blocked. Allow notifications for KAMUN in your device or browser settings.');
  const { publicKey } = await invoke({ action: 'config' });
  const bytes = Uint8Array.from(atob(publicKey.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  const registration = await pushRegistration();
  let subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    const oldKey = subscription.options.applicationServerKey;
    if (oldKey && (new Uint8Array(oldKey).length !== bytes.length || new Uint8Array(oldKey).some((v, i) => v !== bytes[i]))) {
      await subscription.unsubscribe(); subscription = null;
    }
  }
  subscription ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes });
  const value = subscription.toJSON();
  await invoke({ action: 'subscribe', endpoint: subscription.endpoint, keys: value.keys, conferenceId: KAMUN_CONFERENCE_ID });
}
export async function disablePush() {
  const registration = await navigator.serviceWorker.getRegistration('/');
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    // Server first: a failed network request must not leave a hidden active subscription.
    await invoke({ action: 'unsubscribe', endpoint: subscription.endpoint });
    await subscription.unsubscribe();
  }
  registration?.active?.postMessage({ type: 'KAMUN_CLEAR_NOTIFICATIONS' });
}
