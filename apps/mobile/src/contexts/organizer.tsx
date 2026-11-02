import '../lib/install-local-storage';

import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { useAttendeeProfile } from '@/contexts/attendee-profile';
import { resumePendingSignOut } from '@/lib/ecg-handoff';
import { supabase } from '@/lib/supabase';

type OrganizerMode = 'attendee' | 'organizer';
type OrganizerContextValue = {
  mode: OrganizerMode;
  isLoading: boolean;
  conferenceId: string | null;
  signIn: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const STORAGE_KEY = 'kamun.organizer-mode.v1';
const OrganizerContext = createContext<OrganizerContextValue | null>(null);

export function OrganizerProvider({ children }: PropsWithChildren) {
  const { clearProfile } = useAttendeeProfile();
  const [mode, setMode] = useState<OrganizerMode>('attendee');
  const [conferenceId, setConferenceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        if (globalThis.localStorage?.getItem(STORAGE_KEY) !== '1' || !supabase) return;
        const { data: userResult } = await supabase.auth.getUser();
        if (!userResult.user) {
          globalThis.localStorage?.removeItem(STORAGE_KEY);
          return;
        }
        const { data: permittedConference, error } = await supabase.rpc('my_organizer_message_conference');
        if (active) {
          setConferenceId(!error && typeof permittedConference === 'string' ? permittedConference : null);
          setMode(!error && permittedConference ? 'organizer' : 'attendee');
          if (error || !permittedConference) globalThis.localStorage?.removeItem(STORAGE_KEY);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void restore();
    return () => { active = false; };
  }, []);

  const value = useMemo<OrganizerContextValue>(() => ({
    mode,
    isLoading,
    conferenceId,
    async signIn(code) {
      await resumePendingSignOut();
      if (!supabase) throw new Error('The KAMUN backend is not configured.');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) {
        const { error: signInError } = await supabase.auth.signInAnonymously();
        if (signInError) throw signInError;
      }
      const { data: claimedConference, error } = await supabase.rpc('claim_organizer_message_code', { p_code: code.trim() });
      if (error || typeof claimedConference !== 'string') throw error ?? new Error('Invalid organiser code.');
      clearProfile();
      globalThis.localStorage?.setItem(STORAGE_KEY, '1');
      setConferenceId(claimedConference);
      setMode('organizer');
    },
    async signOut() {
      await supabase?.auth.signOut();
      clearProfile();
      globalThis.localStorage?.removeItem(STORAGE_KEY);
      setConferenceId(null);
      setMode('attendee');
    },
  }), [clearProfile, conferenceId, isLoading, mode]);

  return <OrganizerContext.Provider value={value}>{children}</OrganizerContext.Provider>;
}

export function useOrganizer() {
  const context = useContext(OrganizerContext);
  if (!context) throw new Error('useOrganizer must be used inside OrganizerProvider');
  return context;
}
