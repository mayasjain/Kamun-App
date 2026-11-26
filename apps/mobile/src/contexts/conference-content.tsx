import '../lib/install-local-storage';

import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { AppState } from 'react-native';
import { fetchConferenceContent, type ConferenceContent } from '@/lib/conference-content';
import { KAMUN_CONFERENCE_ID } from '@/lib/conference-id';

const cacheKey = `kamun.content.public.${process.env.EXPO_PUBLIC_SUPABASE_URL}.${KAMUN_CONFERENCE_ID}.v1`;

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
  const [content, setContent] = useState<ConferenceContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState<ContentSource>(null);
  const requestVersion = useRef(0);

  const refresh = useCallback(async (silent = false) => {
    const version = ++requestVersion.current;
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const liveContent = await fetchConferenceContent(KAMUN_CONFERENCE_ID);
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
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(async () => {
      if (!active) return;
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
  }, [refresh]);

  useEffect(() => {
    let pending = false;
    const refreshVisible = () => {
      if (pending || AppState.currentState !== 'active'
        || (typeof document !== 'undefined' && document.visibilityState === 'hidden')) return;
      pending = true;
      void refresh(true).finally(() => { pending = false; });
    };
    const timer = setInterval(refreshVisible, 30_000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refreshVisible();
    });
    const onVisible = () => refreshVisible();
    if (typeof window !== 'undefined') window.addEventListener('online', onVisible);
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer); subscription.remove();
      if (typeof window !== 'undefined') window.removeEventListener('online', onVisible);
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  const value = useMemo(() => ({ content, error, isLoading, source, refresh }), [content, error, isLoading, source, refresh]);
  return <ConferenceContentContext.Provider value={value}>{children}</ConferenceContentContext.Provider>;
}

export function useConferenceContent() {
  const context = useContext(ConferenceContentContext);
  if (!context) throw new Error('useConferenceContent must be used inside ConferenceContentProvider');
  return context;
}
