import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getRevenueByCategory } from "@/lib/api/transactions";

export function useRevenueByCategory(branchId?: string) {
  return useQuery({
    queryKey: queryKeys.transactions.byCategoryThisMonth(branchId),
    queryFn: () => getRevenueByCategory(branchId),
  });
}
