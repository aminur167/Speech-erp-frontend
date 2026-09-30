import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getPendingPackageCount } from "@/lib/api/services";

/** Admin-only — the endpoint itself is Admin-gated, so `enabled` must be false for a Manager. */
export function usePendingPackageCount(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.pendingPackages.count,
    queryFn: getPendingPackageCount,
    enabled,
    // No timer of its own: the approval pulse (hooks/useApprovalPulse.ts)
    // refetches this within seconds of a Manager proposing a package.
    refetchOnWindowFocus: true,
  });
}
