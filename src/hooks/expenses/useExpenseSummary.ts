import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getExpenseSummary } from "@/lib/api/expenses";

export function useExpenseSummary(branchId?: string, date?: string) {
  return useQuery({
    queryKey: queryKeys.expenses.summary(branchId, date),
    queryFn: () => getExpenseSummary({ branchId, date }),
  });
}
