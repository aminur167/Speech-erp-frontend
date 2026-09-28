import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  enrollMonthly,
  type EnrollMonthlyInput,
  type EnrollMonthlyResult,
} from "@/lib/api/monthlyEnrollments";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";

/**
 * Enroll in a monthly package and pay the admit fee — one atomic request.
 * Money moved, so the figures that count it are refreshed on success (never
 * before: a payment is only shown once the server has confirmed it).
 */
export function useEnrollMonthly() {
  const queryClient = useQueryClient();
  return useMutation<EnrollMonthlyResult, ApiError, EnrollMonthlyInput>({
    meta: { successMessage: "Enrollment created and admit fee collected." },
    mutationFn: enrollMonthly,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.duePayments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyClosing.all });
    },
  });
}
