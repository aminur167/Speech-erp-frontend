import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewSalaryPayment, type ReviewSalaryPaymentInput } from "@/lib/api/salaryPayments";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { SalaryPayment } from "@/types/domain";

export function useReviewSalaryPayment() {
  const queryClient = useQueryClient();

  return useMutation<SalaryPayment, ApiError, ReviewSalaryPaymentInput>({
    mutationFn: reviewSalaryPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.salaryPayments.all });
    },
  });
}
