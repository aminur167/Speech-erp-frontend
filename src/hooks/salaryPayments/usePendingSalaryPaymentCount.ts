import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getPendingSalaryPaymentCount } from "@/lib/api/salaryPayments";
import { LIVE_POLL_INTERVAL_MS } from "@/lib/livePolling";

/** Admin-only — the endpoint itself is Admin-gated, so `enabled` must be false for a Manager. */
export function usePendingSalaryPaymentCount(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.salaryPayments.pendingCount,
    queryFn: getPendingSalaryPaymentCount,
    enabled,
    // A Manager's request has to show up here without the Admin reloading
    // (see LIVE_POLL_INTERVAL_MS).
    refetchInterval: enabled ? LIVE_POLL_INTERVAL_MS : false,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: true,
  });
}
