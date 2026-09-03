import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getPendingPackageCount } from "@/lib/api/services";
import { LIVE_POLL_INTERVAL_MS } from "@/lib/livePolling";

/** Admin-only — the endpoint itself is Admin-gated, so `enabled` must be false for a Manager. */
export function usePendingPackageCount(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.pendingPackages.count,
    queryFn: getPendingPackageCount,
    enabled,
    // A Manager proposing a package has to show up here without the Admin
    // reloading (see LIVE_POLL_INTERVAL_MS).
    refetchInterval: enabled ? LIVE_POLL_INTERVAL_MS : false,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: true,
  });
}
