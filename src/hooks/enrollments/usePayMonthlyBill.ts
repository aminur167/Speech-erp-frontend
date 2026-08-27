import { useMutation } from "@tanstack/react-query";
import { payMonthlyBill } from "@/lib/api/monthlyEnrollments";
import type { ApiError } from "@/types/api";
import type { MonthlyEnrollment } from "@/types/domain";

export function usePayMonthlyBill() {
  return useMutation<MonthlyEnrollment, ApiError, { enrollmentId: string; month: string }>({
    mutationFn: ({ enrollmentId, month }) => payMonthlyBill(enrollmentId, month),
  });
}
