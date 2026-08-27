import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getMonthlyRevenueByMethod } from "@/lib/api/transactions";

export function useMonthlyRevenueByMethod(branchId?: string) {
  return useQuery({
    queryKey: queryKeys.transactions.byMethodThisMonth(branchId),
    queryFn: () => getMonthlyRevenueByMethod(branchId),
  });
}
