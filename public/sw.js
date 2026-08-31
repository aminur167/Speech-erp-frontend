/**
 * App-shell cache, so the app can at least LOAD when offline (docs/00's
 * Full Offline-First mechanism: "Service Worker + TanStack Query
 * onlineManager + an IndexedDB persister"). This file owns the shell only —
 * data and the mutation queue are TanStack Query's job (see
 * src/providers/QueryProvider.tsx and src/lib/offline/), not this worker's.
 * API requests are deliberately never intercepted here: a Service-Worker
 * cache sitting in front of financial data would risk serving a stale or
 * wrong response instead of the queue's own, more careful offline handling.
 */

const CACHE_NAME = "speech-erp-shell-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function isCacheableStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/logo") ||
    url.pathname.startsWith("/favicon") ||
    url.pathname.startsWith("/materials/") ||
    /\.(png|jpe?g|svg|ico|woff2?)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never intercept API calls -- see the file header.
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match(OFFLINE_URL)),
        ),
    );
    return;
  }

  if (isCacheableStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      }),
    );
  }
});
