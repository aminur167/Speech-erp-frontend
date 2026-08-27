import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getDuePaymentsSummary } from "@/lib/api/duePayments";

export function useDuePaymentsSummary(branchId?: string) {
  return useQuery({
    queryKey: queryKeys.duePayments.summary(branchId),
    queryFn: () => getDuePaymentsSummary(branchId),
  });
}
