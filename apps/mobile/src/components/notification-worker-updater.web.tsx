import { useEffect } from 'react';

/** Refresh an existing notification worker without creating a subscription or prompting. */
export function NotificationWorkerUpdater() {
  useEffect(() => {
    if (!window.isSecureContext || !('serviceWorker' in navigator)) return;
    let stopped = false;
    let pending = false;
    const update = async () => {
      if (stopped || pending || document.visibilityState === 'hidden') return;
      pending = true;
      try {
        const registration = await navigator.serviceWorker.getRegistration('/');
        if (!stopped && registration) {
          await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
          await registration.update();
        }
      } catch { /* Retry on the next foreground or reconnect; never interrupt the app. */ }
      finally { pending = false; }
    };
    void update();
    document.addEventListener('visibilitychange', update);
    window.addEventListener('online', update);
    return () => {
      stopped = true;
      document.removeEventListener('visibilitychange', update);
      window.removeEventListener('online', update);
    };
  }, []);
  return null;
}
