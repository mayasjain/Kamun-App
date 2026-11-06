import '../lib/install-local-storage';

import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { restoreAttendeeAccess, type ClaimedAttendeeAccess } from '@/lib/attendee-access';
import { AccessExpiredError } from '@/lib/function-errors';
import { clearMemeCache } from '@/lib/meme-cache';
import { supabase } from '@/lib/supabase';
import { createRememberedAccess } from '@/lib/remembered-access';

type AttendeeProfile = ClaimedAttendeeAccess;

type AttendeeProfileContextValue = {
  isLoading: boolean;
  profile: AttendeeProfile | null;
  restoreError: string | null;
  saveProfile: (profile: AttendeeProfile) => void;
  clearProfile: () => void;
};

const STORAGE_KEY = 'kamun.attendee-profile.v1';
const AttendeeProfileContext = createContext<AttendeeProfileContextValue | null>(null);

function readStoredProfile(): AttendeeProfile | null {
  try {
    const value = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<AttendeeProfile>;
    if (!parsed.conferenceId || !parsed.conferenceSlug || !parsed.accessLabel || !parsed.accessType) return null;
    return {
      conferenceId: parsed.conferenceId,
      conferenceSlug: parsed.conferenceSlug,
      accessLabel: parsed.accessLabel,
      accessType: parsed.accessType,
      committeeId: parsed.committeeId ?? null,
      committeeName: parsed.committeeName ?? null,
      committeeAbbreviation: parsed.committeeAbbreviation ?? null,
      seatLabel: parsed.seatLabel ?? null,
      identitySource: parsed.identitySource === 'ecg' ? 'ecg' : 'legacy_code',
    };
  } catch {
    return null;
  }
}

export function AttendeeProfileProvider({ children }: PropsWithChildren) {
  const [session] = useState(() => createRememberedAccess<AttendeeProfile>({
    read: readStoredProfile,
    write: (profile) => {
      clearMemeCache();
      const previous = readStoredProfile();
      if (!profile || (previous && (previous.committeeId !== profile.committeeId
        || previous.seatLabel !== profile.seatLabel || previous.accessType !== profile.accessType))) {
        const storage = globalThis.localStorage;
        for (let i = (storage?.length ?? 0) - 1; i >= 0; i--) {
          const key = storage.key(i);
          if (key?.startsWith('kamun.content.')) storage.removeItem(key);
        }
      }
      if (profile) globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(profile));
      else globalThis.localStorage?.removeItem(STORAGE_KEY);
    },
    restore: restoreAttendeeAccess,
    expired: (error) => error instanceof AccessExpiredError,
  }));
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);

  useEffect(() => {
    void session.restore();
    const authSubscription = supabase?.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') session.clear();
    }).data.subscription;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void session.restore();
    });
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void session.restore();
    }, 4 * 60 * 1000);
    const reconnect = () => { void session.restore(); };
    if (typeof window !== 'undefined') window.addEventListener('online', reconnect);
    return () => {
      subscription.remove();
      authSubscription?.unsubscribe();
      clearInterval(timer);
      if (typeof window !== 'undefined') window.removeEventListener('online', reconnect);
    };
  }, [session]);

  const value = useMemo<AttendeeProfileContextValue>(() => ({
    ...state, saveProfile: session.save, clearProfile: session.clear,
  }), [session, state]);

  return <AttendeeProfileContext.Provider value={value}>{children}</AttendeeProfileContext.Provider>;
}

export function useAttendeeProfile() {
  const context = useContext(AttendeeProfileContext);
  if (!context) throw new Error('useAttendeeProfile must be used inside AttendeeProfileProvider');
  return context;
}
