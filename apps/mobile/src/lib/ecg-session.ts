import { KAMUN_CONFERENCE_ID } from '@/lib/conference-id';
import { supabase } from '@/lib/supabase';

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
