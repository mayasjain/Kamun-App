import 'expo-sqlite/localStorage/install';

import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

export type AttendeePosition = 'delegate' | 'chair';

export type AttendeeProfile = {
  accessLabel: string;
  position: AttendeePosition;
};

type AttendeeProfileContextValue = {
  isLoading: boolean;
  profile: AttendeeProfile | null;
  saveProfile: (profile: AttendeeProfile) => void;
};

const STORAGE_KEY = 'kamun.attendee-profile.v1';
const AttendeeProfileContext = createContext<AttendeeProfileContextValue | null>(null);

function readStoredProfile(): AttendeeProfile | null {
  try {
    const value = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<AttendeeProfile>;
    if (!parsed.accessLabel || !parsed.position) return null;
    return {
      accessLabel: parsed.accessLabel,
      position: parsed.position,
    };
  } catch {
    return null;
  }
}

export function AttendeeProfileProvider({ children }: PropsWithChildren) {
  const [profile, setProfile] = useState<AttendeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      setProfile(readStoredProfile());
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AttendeeProfileContextValue>(() => ({
    isLoading,
    profile,
    saveProfile(nextProfile) {
      try {
        globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
      } catch {
        // The profile still works for this session if device storage is unavailable.
      }
      setProfile(nextProfile);
    },
  }), [isLoading, profile]);

  return <AttendeeProfileContext.Provider value={value}>{children}</AttendeeProfileContext.Provider>;
}

export function useAttendeeProfile() {
  const context = useContext(AttendeeProfileContext);
  if (!context) throw new Error('useAttendeeProfile must be used inside AttendeeProfileProvider');
  return context;
}
