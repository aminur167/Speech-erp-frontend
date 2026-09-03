import { useMutation } from "@tanstack/react-query";
import { payInstallment, type PayInstallmentResult } from "@/lib/api/installmentPlans";
import type { ApiError } from "@/types/api";

export function usePayInstallment() {
  return useMutation<
    PayInstallmentResult,
    ApiError,
    {
      planId: string;
      installmentId: string;
      method: string;
      idempotencyKey?: string;
      /** Omitted collects the scheduled figure. */
      amount?: number;
    }
  >({
    mutationKey: ["payInstallment"],
    mutationFn: ({ planId, installmentId, method, idempotencyKey, amount }) =>
      payInstallment(planId, installmentId, method, idempotencyKey, amount),
  });
}
