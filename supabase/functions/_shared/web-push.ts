/** Provider allowlist prevents subscription endpoints from becoming an SSRF proxy. */
export function validPushEndpoint(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && !u.username && !u.password && !u.port && !u.hash
      && (u.hostname === 'fcm.googleapis.com' || u.hostname === 'android.googleapis.com'
        || u.hostname.endsWith('.push.apple.com') || u.hostname === 'updates.push.services.mozilla.com'
        || u.hostname.endsWith('.notify.windows.com'));
  } catch { return false; }
}
export function validPushKeys(value: unknown): value is { p256dh: string; auth: string } {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.p256dh === 'string' && /^[A-Za-z0-9_-]{87}=?$/.test(v.p256dh)
    && typeof v.auth === 'string' && /^[A-Za-z0-9_-]{22}(?:==)?$/.test(v.auth);
}
export function identityMatches(expected: Record<string, unknown>, actual: Record<string, unknown>) {
  return actual.personId === expected.person_id && actual.revision === expected.revision
    && actual.kind === expected.kind && actual.committee === expected.committee && actual.seat === expected.seat;
}
