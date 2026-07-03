const SESSION_KEY = "eventos_admin_secret";

/** Reads the admin secret from sessionStorage, if one was stored this session. */
export function getStoredAdminSecret(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_KEY);
}

/**
 * Stores the admin secret in `sessionStorage` (deliberately not `localStorage`,
 * to keep this session-scoped and mechanically separate from the app's
 * long-lived localStorage data layer in src/store/events.ts).
 */
export function storeAdminSecret(secret: string): void {
  sessionStorage.setItem(SESSION_KEY, secret);
}

/** `fetch()` wrapper that attaches the admin secret as `x-admin-secret`. */
export async function adminFetch(input: string, secret: string, init: RequestInit = {}) {
  return fetch(input, {
    ...init,
    headers: { ...init.headers, "x-admin-secret": secret },
  });
}
