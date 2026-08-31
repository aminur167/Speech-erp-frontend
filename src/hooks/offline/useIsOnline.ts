import { useSyncExternalStore } from "react";
import { onlineManager } from "@tanstack/react-query";

/** Real connectivity (see lib/offline/connectivity.ts), not just navigator.onLine. */
export function useIsOnline(): boolean {
  return useSyncExternalStore(
    (callback) => onlineManager.subscribe(callback),
    () => onlineManager.isOnline(),
    () => true, // SSR default -- corrected on the client the moment this hook mounts.
  );
}
