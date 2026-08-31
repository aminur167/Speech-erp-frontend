/**
 * Registers the app-shell cache (public/sw.js) so the app can load offline.
 *
 * Skipped in development on purpose: a Service Worker's cache-first static
 * asset strategy fights Turbopack's fast refresh (edited code can keep
 * serving the cached pre-edit bundle until the cache is invalidated), which
 * is confusing during development and buys nothing there — dev already runs
 * against a live local server. This is exactly the offline capability a
 * deployed build needs and a dev server doesn't.
 */
export function registerServiceWorker(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline app-shell caching is a progressive enhancement -- if
      // registration fails (unsupported browser, blocked by policy), the
      // app still works fully online, so this is deliberately swallowed
      // rather than surfaced as an error to the user.
    });
  });
}
