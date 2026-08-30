import type { AuthUser } from "@/types/domain";
import { apiClient } from "@/lib/api/client";
import { useAuthTokenStore } from "@/store/authTokenStore";
import { useAuthStore } from "@/store/authStore";
import { getRefreshToken, setRefreshToken } from "@/lib/api/authTokenPersistence";

interface RawUser {
  id: number | string;
  name: string;
  email: string;
  role: "admin" | "manager";
  branchId: string | number | null;
}

function normalizeUser(raw: RawUser): AuthUser {
  return {
    id: String(raw.id),
    name: raw.name,
    email: raw.email,
    role: raw.role,
    branchId: raw.branchId == null ? null : String(raw.branchId),
  };
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<{ user: AuthUser; accessToken: string }> {
  const { data } = await apiClient.post("/auth/login/", input);
  setRefreshToken(data.refreshToken);
  return { user: normalizeUser(data.user), accessToken: data.accessToken };
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  setRefreshToken(null);
  // Best-effort: the token is blacklisted server-side, but the user is
  // logged out locally either way — a network hiccup here shouldn't trap
  // someone on a screen they think is still authenticated.
  try {
    await apiClient.post("/auth/logout/", refreshToken ? { refreshToken } : {});
  } catch {
    // ignored — see above
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data } = await apiClient.get("/auth/me/");
    return normalizeUser(data);
  } catch {
    return null;
  }
}

/**
 * Restores a session on app boot from the persisted refresh token: refresh
 * it for a fresh access token, then fetch the current user. Populates both
 * auth stores directly (rather than returning data for a caller to apply)
 * since the only caller is `AuthProvider`, which just needs this to resolve.
 */
export async function restoreSession(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return;

  try {
    const { data } = await apiClient.post("/auth/refresh/", { refreshToken });
    useAuthTokenStore.getState().setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);

    const user = await getCurrentUser();
    if (user) {
      useAuthStore.getState().login(user, data.accessToken);
    } else {
      setRefreshToken(null);
      useAuthTokenStore.getState().setAccessToken(null);
    }
  } catch {
    setRefreshToken(null);
    useAuthTokenStore.getState().setAccessToken(null);
  }
}

export interface UpdateProfileInput {
  userId: string;
  name: string;
}

export async function updateProfile(input: UpdateProfileInput): Promise<AuthUser> {
  const { data } = await apiClient.patch("/auth/profile/", { name: input.name });
  return normalizeUser(data);
}
