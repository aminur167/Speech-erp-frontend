import axios from "axios";
import type { ApiError } from "@/types/api";
import { useAuthTokenStore } from "@/store/authTokenStore";
import { fieldErrorsToCamelCase } from "@/lib/api/caseUtils";
import { getRefreshToken, setRefreshToken } from "@/lib/api/authTokenPersistence";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthTokenStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 mid-session means the 30-minute access token expired, not that the
// user is actually logged out — silently refresh once and retry the original
// request before giving up. Concurrent 401s share the same in-flight refresh
// so a page firing several requests at once doesn't trigger several refreshes.
//
// Critically, this promise is also exported and reused by `restoreSession()`
// (lib/api/auth.ts) rather than each doing its own separate call. The
// backend rotates+blacklists refresh tokens on every use, so two independent,
// uncoordinated `/auth/refresh/` calls racing on page load -- one from
// session restore, one from an interceptor reacting to a 401 fired before
// restore finished (e.g. a resumed offline mutation) -- isn't just wasteful:
// whichever call loses the race is using a token the winner has already
// rotated away, fails, and its catch block wipes the (still-valid) refresh
// token the winner just wrote, killing an otherwise-healthy session.
let refreshInFlight: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
      const { data } = await axios.post(
        `${apiClient.defaults.baseURL}/auth/refresh/`,
        { refreshToken },
      );
      useAuthTokenStore.getState().setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      return data.accessToken as string;
    } catch {
      setRefreshToken(null);
      useAuthTokenStore.getState().setAccessToken(null);
      return null;
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthEndpoint =
      typeof original?.url === "string" && original.url.includes("/auth/");

    if (error.response?.status === 401 && !original?._retried && !isAuthEndpoint) {
      original._retried = true;
      const newAccessToken = await refreshAccessToken();

      if (newAccessToken) {
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(original);
      }
    }

    const rawFieldErrors = isFieldErrorShape(error.response?.data)
      ? error.response.data
      : undefined;

    const normalized: ApiError = {
      message:
        error.response?.data?.detail ??
        error.response?.data?.message ??
        "Something went wrong. Please try again.",
      fieldErrors: rawFieldErrors ? fieldErrorsToCamelCase(rawFieldErrors) : undefined,
      status: error.response?.status,
    };
    return Promise.reject(normalized);
  },
);

function isFieldErrorShape(data: unknown): data is Record<string, string[]> {
  return (
    typeof data === "object" &&
    data !== null &&
    Object.values(data as Record<string, unknown>).every((v) => Array.isArray(v))
  );
}
