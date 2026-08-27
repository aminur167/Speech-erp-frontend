import { useMutation } from "@tanstack/react-query";
import { payInstallment } from "@/lib/api/installmentPlans";
import type { ApiError } from "@/types/api";
import type { InstallmentPlan } from "@/types/domain";

export function usePayInstallment() {
  return useMutation<InstallmentPlan, ApiError, { planId: string; index: number }>({
    mutationFn: ({ planId, index }) => payInstallment(planId, index),
  });
}
