import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { KAMUN_CONFERENCE_ID } from '@/lib/conference-id';
import { supabase } from '@/lib/supabase';
import { AccessExpiredError, accessHasExpired, functionErrorReason } from '@/lib/function-errors';

export async function openEcgWithKamunIdentity(): Promise<void> {
  if (!supabase) throw new Error('The KAMUN backend is not configured.');
  const { data, error } = await supabase.functions.invoke('ecg-handoff', {
    body: { conferenceId: KAMUN_CONFERENCE_ID },
    timeout: 12_000,
  });
  if (error || typeof data?.url !== 'string') {
    if (accessHasExpired(await functionErrorReason(data, error)))
      throw new AccessExpiredError('Your access has changed. Sign in with your current personal code.');
    throw new Error('KAMUN coffee ordering is unavailable right now. Check your connection and try again.');
  }
  const target = new URL(data.url);
  const expected = new URL(process.env.EXPO_PUBLIC_ECE_URL ?? 'https://cafe.kamun.org/');
  if (target.protocol !== 'https:' || target.username || target.password || target.search
    || target.origin !== expected.origin || target.pathname !== '/'
    || !/^#handoff=[A-Za-z0-9_-]{43}$/.test(target.hash))
    throw new Error('KAMUN coffee ordering returned an invalid link. Please try again later.');
  if (Platform.OS === 'web') {
    window.location.assign(target.toString());
  } else {
    await Linking.openURL(target.toString());
  }
}

export async function closeEcgSession(): Promise<void> {
  if (!supabase) throw new Error('The KAMUN backend is not configured.');
  const { data, error } = await supabase.functions.invoke('ecg-logout', {
    body: { conferenceId: KAMUN_CONFERENCE_ID }, timeout: 12_000,
  });
  if (error || data?.ok !== true)
    throw new Error('Could not finish signing out of KAMUN. Reconnect and try again.');
}

const PENDING_SIGN_OUT = 'kamun.pending-sign-out.v1';
let pendingSignOut: Promise<void> | null = null;

/** Retain a retry marker until both backends have finished, including after app restart. */
export function signOutOfBothApps(): Promise<void> {
  if (pendingSignOut) return pendingSignOut;
  globalThis.localStorage?.setItem(PENDING_SIGN_OUT, '1');
  pendingSignOut = (async () => {
    await closeEcgSession();
    const result = await supabase!.auth.signOut({ scope: 'local' });
    if (result.error) throw result.error;
    globalThis.localStorage?.removeItem(PENDING_SIGN_OUT);
  })().finally(() => { pendingSignOut = null; });
  return pendingSignOut;
}

export async function resumePendingSignOut(): Promise<boolean> {
  if (globalThis.localStorage?.getItem(PENDING_SIGN_OUT) !== '1') return false;
  await signOutOfBothApps();
  return true;
}
