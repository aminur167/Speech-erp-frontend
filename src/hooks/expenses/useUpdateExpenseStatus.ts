import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateExpenseStatus } from "@/lib/api/expenses";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { Expense, ExpenseStatus } from "@/types/domain";

export function useUpdateExpenseStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    Expense,
    ApiError,
    { id: string; status: Extract<ExpenseStatus, "approved" | "rejected"> }
  >({
    mutationFn: ({ id, status }) => updateExpenseStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
    },
  });
}
