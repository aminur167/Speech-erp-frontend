/**
 * The refresh token is the one piece of auth state that survives a page
 * reload — everything else (the access token, the current user) is re-derived
 * from it on boot via `restoreSession()` in `lib/api/auth.ts`. Kept as a plain
 * localStorage helper rather than a Zustand `persist` store so `client.ts`
 * can read/write it without importing any store (avoids a circular import,
 * same reasoning as `authTokenStore.ts` already documents).
 */

const STORAGE_KEY = "speech-erp:refreshToken";

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function setRefreshToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
