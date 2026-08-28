import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getTransactionsSummary } from "@/lib/api/transactions";

export function useTransactionsSummary(branchId?: string, date?: string) {
  return useQuery({
    queryKey: queryKeys.transactions.summary(branchId, date),
    queryFn: () => getTransactionsSummary(branchId, date),
  });
}
