import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getExpenseSummary } from "@/lib/api/expenses";

export function useExpenseSummary(branchId?: string) {
  return useQuery({
    queryKey: queryKeys.expenses.summary(branchId),
    queryFn: () => getExpenseSummary({ branchId }),
  });
}
