import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listExpenses, type ExpenseListParams } from "@/lib/api/expenses";

/**
 * `enabled` lets a screen that shows several of these lists behind tabs fetch
 * only the one on view — without it, opening such a page fires every list at
 * once for data nobody is looking at.
 */
export function useExpenses(
  params: ExpenseListParams,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.expenses.list(params),
    queryFn: () => listExpenses(params),
    placeholderData: (previousData) => previousData,
    enabled: options.enabled ?? true,
  });
}
