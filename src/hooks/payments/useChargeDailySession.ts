import { useMutation, useQueryClient } from "@tanstack/react-query";
import { chargeDailySession, type ChargeDailySessionInput } from "@/lib/api/payments";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { Payment } from "@/types/domain";

/**
 * Charge one daily session at the catalogue fee, less any discount.
 *
 * Replaces `useCreatePayment` on the daily screen: that posted the fee the
 * browser was holding, so a discount was given by typing a smaller number
 * and nothing recorded that one had been given (see `chargeDailySession`).
 */
export function useChargeDailySession() {
  const queryClient = useQueryClient();

  return useMutation<Payment, ApiError, ChargeDailySessionInput>({
    meta: { successMessage: "Payment recorded." },
    mutationFn: chargeDailySession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });
}
