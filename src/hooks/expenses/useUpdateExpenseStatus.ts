import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewExpense, type ReviewExpenseInput } from "@/lib/api/expenses";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { Expense } from "@/types/domain";

export function useUpdateExpenseStatus() {
  const queryClient = useQueryClient();

  return useMutation<Expense, ApiError, ReviewExpenseInput>({
    mutationFn: reviewExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
    },
  });
}
