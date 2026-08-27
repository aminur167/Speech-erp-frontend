import { create } from "zustand";

/**
 * Access token only — kept separate from useAuthStore so lib/api/client.ts
 * can read it without importing the full auth store (avoids a circular import).
 */
interface AuthTokenState {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
}

export const useAuthTokenStore = create<AuthTokenState>((set) => ({
  accessToken: null,
  setAccessToken: (token) => set({ accessToken: token }),
}));
