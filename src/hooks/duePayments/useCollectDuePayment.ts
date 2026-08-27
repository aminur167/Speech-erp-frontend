import { useMutation, useQueryClient } from "@tanstack/react-query";
import { collectDuePayment, type CollectDuePaymentInput } from "@/lib/api/duePayments";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { Payment } from "@/types/domain";

export function useCollectDuePayment() {
  const queryClient = useQueryClient();

  return useMutation<Payment, ApiError, CollectDuePaymentInput>({
    mutationFn: collectDuePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.duePayments.all });
    },
  });
}
