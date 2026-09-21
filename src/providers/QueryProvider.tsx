"use client";

import { useEffect, useState } from "react";
import { MutationCache, QueryClient, onlineManager } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { indexedDbPersister } from "@/lib/offline/persister";
import { startConnectivityDetection } from "@/lib/offline/connectivity";
import { registerServiceWorker } from "@/lib/offline/registerServiceWorker";
import { registerOfflineMutationDefaults } from "@/lib/offline/mutationDefaults";
import { toast } from "@/store/toastStore";
import { useAuthStore } from "@/store/authStore";
import { CACHE_GC_MS, DEFAULT_STALE_MS } from "@/lib/cacheTiming";
import type { ApiError } from "@/types/api";

/**
 * Retries a genuine network failure (no response at all -- `status` is
 * undefined) or a possibly-transient server error (5xx) once, but never a
 * definitive client error (400 validation, 401/403/404/409...). A 400 for a
 * duplicate code will fail exactly the same way a second time -- retrying it
 * doesn't fix anything, it just sits the user in front of a stuck "Loading"
 * button for a retry cycle before the real error they need to see finally
 * shows up. A plain `retry: 1` (this project's original default) doesn't
 * make that distinction and retries everything, including errors that can
 * never succeed.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  const status = (error as ApiError | undefined)?.status;
  if (status !== undefined && status < 500) return false;
  return failureCount < 1;
}

/**
 * Whose data is in the cache, kept beside it in localStorage.
 *
 * Two events can happen in either order on page load: the IndexedDB cache
 * finishing its restore, and a user signing in (or the saved session being
 * restored). Comparing both against this id means whichever comes second
 * still wipes another user's data. Storage can be unavailable (private
 * mode); then nothing is remembered and the cache is simply cleared on login.
 */
const CACHE_OWNER_KEY = "speech-erp-cache-owner";
const cacheOwner = {
  get(): string | null {
    try {
      return window.localStorage.getItem(CACHE_OWNER_KEY);
    } catch {
      return null;
    }
  },
  set(id: string | null) {
    try {
      if (id) window.localStorage.setItem(CACHE_OWNER_KEY, id);
      else window.localStorage.removeItem(CACHE_OWNER_KEY);
    } catch {
      // ignored -- see above
    }
  },
};

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Read once, before anyone can sign in: the owner of whatever the
  // IndexedDB restore is about to bring back.
  const [ownerAtLoad] = useState(() => cacheOwner.get());
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      // Every write in the app reports its outcome here, once, instead of
      // each of ~47 hooks and their screens deciding separately how to show
      // it. Errors always toast — a screen with its own answer opts out with
      // `meta.errorToast: false`. Successes toast only when the hook names a
      // message, because confirming every attendance click would be noise.
      //
      // A mutation paused offline does not error; it waits in the outbox, so
      // nothing toasts until the server has actually answered.
      mutationCache: new MutationCache({
        onError: (error, _variables, _onMutateResult, mutation) => {
          if (mutation.meta?.errorToast === false) return;
          toast.error(error, { title: mutation.meta?.errorTitle });
        },
        onSuccess: (_data, _variables, _onMutateResult, mutation) => {
          const message = mutation.meta?.successMessage;
          if (message) toast.success(message);
        },
      }),
      defaultOptions: {
        queries: {
          staleTime: DEFAULT_STALE_MS,
          // See src/lib/cacheTiming.ts. The default of 5 minutes dropped any
          // page not visited for 5 minutes, so going back meant a spinner
          // even though the data was right there in IndexedDB.
          gcTime: CACHE_GC_MS,
          retry: shouldRetry,
          refetchOnWindowFocus: false,
          // A query attempted offline serves whatever's cached instead of
          // failing outright — the manager can still browse the patient
          // list they already loaded (docs/00's offline-first target UX).
          networkMode: "offlineFirst",
        },
        mutations: {
          // A write attempted offline goes to "paused" instead of failing,
          // and sits there until connectivity returns — the core of the
          // outbox. Never silently drop the item; see the auto-resume
          // wiring below.
          networkMode: "offlineFirst",
          retry: shouldRetry,
        },
      },
    });
    // Must run before the persisted cache is restored below: a mutation
    // resumed from IndexedDB after a real reload has no component watching
    // it, so it can only find its mutationFn via a registered default keyed
    // by mutationKey (functions aren't serializable, so they never survive
    // in the persisted payload itself).
    registerOfflineMutationDefaults(client);
    return client;
  });

  useEffect(() => {
    startConnectivityDetection();
    registerServiceWorker();

    // TanStack Query resumes paused QUERIES automatically when onlineManager
    // flips to online, but paused MUTATIONS need an explicit nudge — this is
    // the "auto-flush on reconnect" requirement (docs/00 item 6): staff do
    // nothing, the queue drains itself the moment the branch is back online.
    return onlineManager.subscribe((isOnline) => {
      if (isOnline) {
        void queryClient.resumePausedMutations();
      }
    });
  }, [queryClient]);

  // Cached data belongs to one user. A clinic PC is shared and data is kept
  // for days (cacheTiming.ts), so without this the next person to sign in --
  // a manager of another branch -- would see the previous user's patients
  // and payments until each page refreshed. See cacheOwner below.
  useEffect(
    () =>
      useAuthStore.subscribe((state, previous) => {
        if (previous.isAuthenticated && !state.isAuthenticated) {
          queryClient.removeQueries();
          cacheOwner.set(null);
        }
        if (!previous.isAuthenticated && state.isAuthenticated && state.user) {
          if (cacheOwner.get() !== state.user.id) queryClient.removeQueries();
          cacheOwner.set(state.user.id);
        }
      }),
    [queryClient],
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: indexedDbPersister,
        // Same window as gcTime -- see src/lib/cacheTiming.ts.
        maxAge: CACHE_GC_MS,
        dehydrateOptions: {
          // Queries only persist once they've actually resolved -- an
          // in-flight or failed fetch has nothing worth restoring.
          shouldDehydrateQuery: (query) => query.state.status === "success",
          // Every mutation persists regardless of state -- a "paused" one is
          // exactly the outbox item that must survive a refresh or the
          // browser closing (docs/00's "IndexedDB-backed outbox").
          shouldDehydrateMutation: () => true,
        },
      }}
      onSuccess={() => {
        // The restore can finish after someone else has already signed in;
        // what it brought back belongs to whoever owned the cache when the
        // page loaded.
        if (ownerAtLoad !== cacheOwner.get()) queryClient.removeQueries();
        // Fires once the persisted cache has finished restoring from
        // IndexedDB -- resume anything that was still queued the last time
        // this device was open, assuming we're online now.
        void queryClient.resumePausedMutations();
      }}
    >
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </PersistQueryClientProvider>
  );
}
