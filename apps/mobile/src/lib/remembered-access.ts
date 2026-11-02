type Snapshot<T> = { profile: T | null; isLoading: boolean; restoreError: string | null };

/** Cached identity is for offline display only. The backend still authorizes every request. */
export function createRememberedAccess<T>(options: {
  read: () => T | null;
  write: (profile: T | null) => void;
  restore: () => Promise<T | null>;
  expired: (error: unknown) => boolean;
}) {
  let state: Snapshot<T> = { profile: null, isLoading: true, restoreError: null };
  let version = 0;
  let pending: Promise<void> | null = null;
  let initialized = false;
  const listeners = new Set<() => void>();
  function publish(next: Snapshot<T>) {
    state = next;
    listeners.forEach((listener) => listener());
  }
  function persist(profile: T | null) {
    try { options.write(profile); } catch { /* Storage failure does not discard this session. */ }
  }
  function setProfile(profile: T | null) {
    version += 1;
    pending = null;
    initialized = true;
    persist(profile);
    publish({ profile, isLoading: false, restoreError: null });
  }
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    save: (profile: T) => setProfile(profile),
    clear: () => setProfile(null),
    restore(): Promise<void> {
      if (pending) return pending;
      if (!initialized) {
        initialized = true;
        let cached: T | null = null;
        try { cached = options.read(); } catch { /* Continue with the saved auth session. */ }
        publish({ profile: cached, isLoading: !cached, restoreError: null });
      }
      const currentVersion = version;
      pending = (async () => {
        try {
          const profile = await options.restore();
          if (version !== currentVersion) return;
          persist(profile);
          publish({ profile, isLoading: false, restoreError: null });
        } catch (error) {
          if (version !== currentVersion) return;
          if (options.expired(error)) {
            persist(null);
            publish({ profile: null, isLoading: false,
              restoreError: 'Your access has expired or changed. Enter your current personal code.' });
          } else {
            publish({ profile: state.profile, isLoading: false,
              restoreError: state.profile
                ? 'Showing saved information. Your access will be checked when you reconnect.'
                : 'Could not restore your session. Check your connection and try again.' });
          }
        } finally { if (version === currentVersion) pending = null; }
      })();
      return pending;
    },
  };
}
