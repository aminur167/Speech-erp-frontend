import { create } from "zustand";
import type { AuthUser } from "@/types/domain";
import { useAuthTokenStore } from "@/store/authTokenStore";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser, accessToken: string) => void;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user, accessToken) => {
    useAuthTokenStore.getState().setAccessToken(accessToken);
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    useAuthTokenStore.getState().setAccessToken(null);
    set({ user: null, isAuthenticated: false });
  },
  updateUser: (user) => set({ user }),
}));
