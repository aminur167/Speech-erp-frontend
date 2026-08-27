import { useMutation } from "@tanstack/react-query";
import {
  createMonthlyEnrollment,
  type CreateMonthlyEnrollmentInput,
} from "@/lib/api/monthlyEnrollments";
import type { ApiError } from "@/types/api";
import type { MonthlyEnrollment } from "@/types/domain";

export function useCreateMonthlyEnrollment() {
  return useMutation<MonthlyEnrollment, ApiError, CreateMonthlyEnrollmentInput>({
    mutationFn: createMonthlyEnrollment,
  });
}
