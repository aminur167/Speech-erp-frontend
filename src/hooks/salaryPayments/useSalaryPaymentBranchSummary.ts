import { useQuery } from "@tanstack/react-query";
import { getSalaryPaymentBranchSummary } from "@/lib/api/salaryPayments";
import { queryKeys } from "@/lib/queryKeys";

/** `month` is an ISO "YYYY-MM"; omit for all-time totals. */
export function useSalaryPaymentBranchSummary(month?: string) {
  return useQuery({
    queryKey: queryKeys.salaryPayments.branchSummary(month),
    queryFn: () => getSalaryPaymentBranchSummary(month),
  });
}
