import { AccessibilityInfo, Platform, Vibration } from 'react-native';

/** Foreground best-effort haptic feedback. Unsupported browsers still get the visual banner. */
export async function signalCoffeeReady(stillVisible: () => boolean): Promise<void> {
  try {
    if (!stillVisible()) return;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
      if (typeof navigator !== 'undefined' && stillVisible()) navigator.vibrate?.([200, 100, 200]);
    } else {
      if (await AccessibilityInfo.isReduceMotionEnabled()) return;
      if (stillVisible()) Vibration.vibrate([0, 200, 100, 200]);
    }
  } catch { /* A haptic failure must never interrupt status updates. */ }
}
