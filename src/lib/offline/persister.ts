import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { get, set, del } from "idb-keyval";

/**
 * Persists the query/mutation cache to IndexedDB so a queued-but-unsent
 * mutation (a payment collected offline, a patient registered offline)
 * survives a page refresh or the browser closing — docs/00's "Persistent
 * queue... an IndexedDB-backed outbox that survives refresh and browser
 * restart (like an email Outbox)".
 *
 * idb-keyval's get/set/del are bare functions, not an object; wrapped here
 * into the {getItem, setItem, removeItem} shape the persister expects.
 */
export const indexedDbPersister = createAsyncStoragePersister({
  key: "speech-erp-offline-cache",
  storage: {
    getItem: (key: string) => get(key),
    setItem: (key: string, value: string) => set(key, value),
    removeItem: (key: string) => del(key),
  },
  // A page load with no network at all must not block on a persister write
  // that can never complete — throttle instead of dropping silently.
  throttleTime: 1_000,
});
