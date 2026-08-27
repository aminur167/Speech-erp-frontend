import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getTransactionsSummary } from "@/lib/api/transactions";

export function useTransactionsSummary(branchId?: string) {
  return useQuery({
    queryKey: queryKeys.transactions.summary(branchId),
    queryFn: () => getTransactionsSummary(branchId),
  });
}
