import { useMutation, useQueryClient } from "@tanstack/react-query";
import { voidPayment } from "@/lib/api/payments";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { Payment } from "@/types/domain";

export function useVoidPayment() {
  const queryClient = useQueryClient();

  return useMutation<Payment, ApiError, { paymentId: string; reason: string }>({
    mutationFn: ({ paymentId, reason }) => voidPayment(paymentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyClosing.all });
    },
  });
}
