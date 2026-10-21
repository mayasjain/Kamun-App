import '../lib/install-local-storage';

import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useAttendeeProfile } from '@/contexts/attendee-profile';
import { fetchConferenceContent, type ConferenceContent } from '@/lib/conference-content';

type ContentSource = 'live' | 'cache' | null;

type ConferenceContentContextValue = {
  content: ConferenceContent | null;
  error: string | null;
  isLoading: boolean;
  source: ContentSource;
  refresh: () => Promise<void>;
};

const ConferenceContentContext = createContext<ConferenceContentContextValue | null>(null);

export function ConferenceContentProvider({ children }: PropsWithChildren) {
  const { profile } = useAttendeeProfile();
  const [content, setContent] = useState<ConferenceContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState<ContentSource>(null);
  const cacheKey = `kamun.content.${profile?.conferenceId ?? 'none'}.${profile?.committeeId ?? 'all'}.v2`;
  const requestVersion = useRef(0);

  const refresh = useCallback(async () => {
    if (!profile) return;
    const version = ++requestVersion.current;
    setIsLoading(true);
    setError(null);
    try {
      const liveContent = await fetchConferenceContent(profile.conferenceId, profile.committeeId);
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

  const value = useMemo(() => ({ content, error, isLoading, source, refresh }), [content, error, isLoading, source, refresh]);
  return <ConferenceContentContext.Provider value={value}>{children}</ConferenceContentContext.Provider>;
}

export function useConferenceContent() {
  const context = useContext(ConferenceContentContext);
  if (!context) throw new Error('useConferenceContent must be used inside ConferenceContentProvider');
  return context;
}
