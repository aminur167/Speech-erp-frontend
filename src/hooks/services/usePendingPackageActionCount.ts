import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getPendingPackageActionCount } from "@/lib/api/services";

/** Admin-only — the endpoint itself is Admin-gated, so `enabled` must be false for a Manager. */
export function usePendingPackageActionCount(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.packageActionRequests.pendingCount,
    queryFn: getPendingPackageActionCount,
    enabled,
    // No timer of its own: the approval pulse (hooks/useApprovalPulse.ts)
    // refetches this within seconds of a Manager raising a request.
    refetchOnWindowFocus: true,
  });
}
