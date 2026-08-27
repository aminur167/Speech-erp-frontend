import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getRevenueTrend } from "@/lib/api/transactions";

export function useRevenueTrend(branchId?: string, days = 7) {
  return useQuery({
    queryKey: queryKeys.transactions.trend(branchId, days),
    queryFn: () => getRevenueTrend(branchId, days),
  });
}
