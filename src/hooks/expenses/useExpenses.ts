import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listExpenses, type ExpenseListParams } from "@/lib/api/expenses";

export function useExpenses(params: ExpenseListParams) {
  return useQuery({
    queryKey: queryKeys.expenses.list(params),
    queryFn: () => listExpenses(params),
    placeholderData: (previousData) => previousData,
  });
}
