export async function functionErrorReason(data: unknown, error: unknown): Promise<string | null> {
  const response = error && typeof error === 'object' && 'context' in error ? error.context : null;
  const body = response instanceof Response
    ? await response.clone().json().catch(() => null) as { error?: unknown } | null
    : null;
  const reason = body?.error ?? (data && typeof data === 'object' && 'error' in data ? data.error : null);
  if (typeof reason === 'string') return reason;
  return response instanceof Response && response.status === 401 ? 'unauthorized' : null;
}

export class AccessExpiredError extends Error {}

export function accessHasExpired(reason: string | null): boolean {
  return reason === 'revoked' || reason === 'unbound' || reason === 'unauthorized';
}
