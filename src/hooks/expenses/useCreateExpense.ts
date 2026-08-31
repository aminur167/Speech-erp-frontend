import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createExpense, type CreateExpenseInput } from "@/lib/api/expenses";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { Expense } from "@/types/domain";

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation<Expense, ApiError, CreateExpenseInput>({
    mutationKey: ["createExpense"],
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
    },
  });
}
