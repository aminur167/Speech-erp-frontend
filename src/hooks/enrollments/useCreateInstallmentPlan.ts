import { useMutation } from "@tanstack/react-query";
import {
  createInstallmentPlan,
  type CreateInstallmentPlanInput,
} from "@/lib/api/installmentPlans";
import type { ApiError } from "@/types/api";
import type { InstallmentPlan } from "@/types/domain";

export function useCreateInstallmentPlan() {
  return useMutation<InstallmentPlan, ApiError, CreateInstallmentPlanInput>({
    mutationFn: createInstallmentPlan,
  });
}
