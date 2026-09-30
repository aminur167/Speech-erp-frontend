import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getPendingSalaryPaymentCount } from "@/lib/api/salaryPayments";

/** Admin-only — the endpoint itself is Admin-gated, so `enabled` must be false for a Manager. */
export function usePendingSalaryPaymentCount(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.salaryPayments.pendingCount,
    queryFn: getPendingSalaryPaymentCount,
    enabled,
    // No timer of its own: the approval pulse (hooks/useApprovalPulse.ts)
    // refetches this within seconds of a Manager raising a request.
    refetchOnWindowFocus: true,
  });
}
