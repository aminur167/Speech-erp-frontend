"use client";

import { useEffect, useState } from "react";
import { QueryClient, onlineManager } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { indexedDbPersister } from "@/lib/offline/persister";
import { startConnectivityDetection } from "@/lib/offline/connectivity";
import { registerServiceWorker } from "@/lib/offline/registerServiceWorker";
import { registerOfflineMutationDefaults } from "@/lib/offline/mutationDefaults";

const SEVEN_DAYS_MS = 1000 * 60 * 60 * 24 * 7;

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
          retry: 1,
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
          retry: 1,
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

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: indexedDbPersister,
        maxAge: SEVEN_DAYS_MS,
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
