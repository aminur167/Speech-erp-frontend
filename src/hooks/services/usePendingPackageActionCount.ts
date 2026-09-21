import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getPendingPackageActionCount } from "@/lib/api/services";
import { LIVE_POLL_INTERVAL_MS } from "@/lib/livePolling";

/** Admin-only — the endpoint itself is Admin-gated, so `enabled` must be false for a Manager. */
export function usePendingPackageActionCount(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.packageActionRequests.pendingCount,
    queryFn: getPendingPackageActionCount,
    enabled,
    // A Manager's request has to show up here without the Admin reloading.
    refetchInterval: enabled ? LIVE_POLL_INTERVAL_MS : false,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
  });
}
