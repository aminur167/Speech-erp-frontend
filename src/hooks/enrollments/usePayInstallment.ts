import { useMutation } from "@tanstack/react-query";
import { payInstallment, type PayInstallmentResult } from "@/lib/api/installmentPlans";
import type { ApiError } from "@/types/api";

export function usePayInstallment() {
  return useMutation<
    PayInstallmentResult,
    ApiError,
    { planId: string; installmentId: string; method: string; idempotencyKey?: string }
  >({
    mutationFn: ({ planId, installmentId, method, idempotencyKey }) =>
      payInstallment(planId, installmentId, method, idempotencyKey),
  });
}
