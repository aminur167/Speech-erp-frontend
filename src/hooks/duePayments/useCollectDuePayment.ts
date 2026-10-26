import { useMutation, useQueryClient } from "@tanstack/react-query";
import { collectDuePayment, type CollectDuePaymentInput } from "@/lib/api/duePayments";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { Payment } from "@/types/domain";

export function useCollectDuePayment() {
  const queryClient = useQueryClient();

  // `Payment | null`: a discount can cover the whole bill, settling it with
  // no money and no receipt.
  return useMutation<Payment | null, ApiError, CollectDuePaymentInput>({
    meta: { successMessage: "Payment collected." },
    mutationKey: ["collectDuePayment"],
    mutationFn: collectDuePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.duePayments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });
}
