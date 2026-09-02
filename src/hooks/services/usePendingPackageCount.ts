import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getPendingPackageCount } from "@/lib/api/services";

const POLL_INTERVAL_MS = 30_000;

/** Admin-only — the endpoint itself is Admin-gated, so `enabled` must be false for a Manager. */
export function usePendingPackageCount(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.pendingPackages.count,
    queryFn: getPendingPackageCount,
    enabled,
    refetchInterval: enabled ? POLL_INTERVAL_MS : false,
  });
}
