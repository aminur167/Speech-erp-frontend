import { useMutation, useQueryClient } from "@tanstack/react-query";
import { disburseSalaryPayment, type DisburseSalaryPaymentInput } from "@/lib/api/salaryPayments";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { SalaryPayment } from "@/types/domain";

export function useDisburseSalaryPayment() {
  const queryClient = useQueryClient();

  return useMutation<SalaryPayment, ApiError, DisburseSalaryPaymentInput>({
    mutationFn: disburseSalaryPayment,
    onSuccess: () => {
      // Disbursing creates an Expense, so payroll now shows up there too.
      queryClient.invalidateQueries({ queryKey: queryKeys.salaryPayments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
  });
}
