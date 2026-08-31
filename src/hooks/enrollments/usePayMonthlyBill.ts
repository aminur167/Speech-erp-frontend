import { useMutation } from "@tanstack/react-query";
import { payMonthlyBill, type PayMonthlyBillResult } from "@/lib/api/monthlyEnrollments";
import type { ApiError } from "@/types/api";

export function usePayMonthlyBill() {
  return useMutation<
    PayMonthlyBillResult,
    ApiError,
    { enrollmentId: string; billId: string; method: string; idempotencyKey?: string }
  >({
    mutationKey: ["payMonthlyBill"],
    mutationFn: ({ enrollmentId, billId, method, idempotencyKey }) =>
      payMonthlyBill(enrollmentId, billId, method, idempotencyKey),
  });
}
