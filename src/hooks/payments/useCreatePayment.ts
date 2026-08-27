import { useMutation } from "@tanstack/react-query";
import { createPayment, type CreatePaymentInput } from "@/lib/api/payments";
import type { ApiError } from "@/types/api";
import type { Payment } from "@/types/domain";

export function useCreatePayment() {
  return useMutation<Payment, ApiError, CreatePaymentInput>({
    mutationFn: createPayment,
  });
}
