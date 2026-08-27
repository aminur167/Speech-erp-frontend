import axios from "axios";
import type { ApiError } from "@/types/api";
import { useAuthTokenStore } from "@/store/authTokenStore";

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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized: ApiError = {
      message:
        error.response?.data?.detail ??
        error.response?.data?.message ??
        "Something went wrong. Please try again.",
      fieldErrors: isFieldErrorShape(error.response?.data)
        ? error.response.data
        : undefined,
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
