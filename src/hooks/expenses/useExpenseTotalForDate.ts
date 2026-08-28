import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getExpenseTotalForDate } from "@/lib/api/expenses";

export function useExpenseTotalForDate(branchId: string | undefined, date: string) {
  return useQuery({
    queryKey: queryKeys.expenses.totalForDate(branchId, date),
    queryFn: () => getExpenseTotalForDate(branchId, date),
    enabled: Boolean(date),
  });
}
