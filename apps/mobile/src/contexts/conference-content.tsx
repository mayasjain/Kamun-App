import '../lib/install-local-storage';

import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useAttendeeProfile } from '@/contexts/attendee-profile';
import { supabase } from '@/lib/supabase';
import { fetchConferenceContent, type ConferenceContent } from '@/lib/conference-content';

type ContentSource = 'live' | 'cache' | null;

type ConferenceContentContextValue = {
  content: ConferenceContent | null;
  error: string | null;
  isLoading: boolean;
  source: ContentSource;
  refresh: () => Promise<void>;
  removeAnnouncement: (id: string) => Promise<void>;
};

const ConferenceContentContext = createContext<ConferenceContentContextValue | null>(null);

export function ConferenceContentProvider({ children }: PropsWithChildren) {
  const { profile } = useAttendeeProfile();
  const [content, setContent] = useState<ConferenceContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState<ContentSource>(null);
  const cacheKey = `kamun.content.${profile?.conferenceId ?? 'none'}.${profile?.accessType ?? 'none'}.${profile?.committeeId ?? 'all'}.v4`;
  const requestVersion = useRef(0);

  const refresh = useCallback(async () => {
    if (!profile) return;
    const version = ++requestVersion.current;
    setIsLoading(true);
    setError(null);
    try {
      const liveContent = await fetchConferenceContent(profile.conferenceId, profile.committeeId, profile.accessType);
      if (version !== requestVersion.current) return;
      setContent(liveContent);
      setSource('live');
      try {
        globalThis.localStorage?.setItem(cacheKey, JSON.stringify(liveContent));
      } catch {
        // Live content remains available when local storage is unavailable.
      }
    } catch {
      if (version === requestVersion.current) setError('Live information could not be updated.');
    } finally {
      if (version === requestVersion.current) setIsLoading(false);
    }
  }, [cacheKey, profile]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(async () => {
      if (!active || !profile) return;
      setContent(null);
      setSource(null);
      try {
        const cached = globalThis.localStorage?.getItem(cacheKey);
        if (cached) {
          setContent(JSON.parse(cached) as ConferenceContent);
          setSource('cache');
        }
      } catch {
        // Ignore an unavailable or outdated cache and fetch fresh content.
      }
      if (active) await refresh();
    });
    return () => {
      active = false;
      requestVersion.current += 1;
    };
  }, [cacheKey, profile, refresh]);

  const removeAnnouncement = useCallback(async (id: string) => {
    if (!supabase || profile?.accessType !== 'admin') throw new Error('Administrator access required.');
    const { data, error } = await supabase.rpc('remove_conference_content', {
      p_conference_id: profile.conferenceId, p_table: 'announcements', p_id: id,
    });
    if (error || !data) throw new Error('Could not remove this item. Check your connection and admin access.');
    setContent(current => {
      if (!current) return current;
      const next = { ...current, announcements: current.announcements.filter(item => item.id !== id) };
      try { globalThis.localStorage?.setItem(cacheKey, JSON.stringify(next)); } catch { /* Storage may be unavailable. */ }
      return next;
    });
    await refresh();
  }, [profile, cacheKey, refresh]);

  const value = useMemo(() => ({ content, error, isLoading, source, refresh, removeAnnouncement }), [content, error, isLoading, source, refresh, removeAnnouncement]);
  return <ConferenceContentContext.Provider value={value}>{children}</ConferenceContentContext.Provider>;
}

export function useConferenceContent() {
  const context = useContext(ConferenceContentContext);
  if (!context) throw new Error('useConferenceContent must be used inside ConferenceContentProvider');
  return context;
}
