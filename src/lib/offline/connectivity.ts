import { onlineManager } from "@tanstack/react-query";

/**
 * Real connectivity detection (docs/00's Full Offline-First section):
 * `navigator.onLine` only reports whether a network interface is up, not
 * whether the server is actually reachable — a laptop connected to a router
 * with no internet still reads `navigator.onLine === true`. This pings the
 * backend's health check instead and wires the result into TanStack
 * Query's `onlineManager`, which is what actually gates whether paused
 * mutations resume.
 */

const HEALTH_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api"}/health/`;
const POLL_INTERVAL_MS = 20_000;
const REACHABILITY_TIMEOUT_MS = 5_000;

async function isServerReachable(): Promise<boolean> {
  if (!navigator.onLine) return false; // the interface itself is down; no point pinging.

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REACHABILITY_TIMEOUT_MS);
    const response = await fetch(HEALTH_URL, {
      signal: controller.signal,
      cache: "no-store",
      // No Authorization header on purpose — this is a pure reachability
      // probe, not an authenticated request, and must never trigger the
      // token-refresh interceptor.
    });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

let started = false;

/** Call once, on app boot. Idempotent — a second call is a no-op. */
export function startConnectivityDetection(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  onlineManager.setEventListener((setOnline) => {
    const check = () => {
      void isServerReachable().then(setOnline);
    };

    check();
    window.addEventListener("online", check);
    window.addEventListener("offline", () => setOnline(false));
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") check();
    });

    // The browser's 'online' event fires for interface-level changes, not
    // for "the server came back up while the network stayed connected" — a
    // branch's router can flap without the OS ever reporting a change. Poll
    // regardless of what the interface claims.
    const interval = setInterval(check, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  });
}
