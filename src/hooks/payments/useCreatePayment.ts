import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPayment, type CreatePaymentInput } from "@/lib/api/payments";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { Payment } from "@/types/domain";

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation<Payment, ApiError, CreatePaymentInput>({
    mutationFn: createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyClosing.all });
    },
  });
}
