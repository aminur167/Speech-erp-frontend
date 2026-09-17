import { useMutation, useQueryClient } from "@tanstack/react-query";
import { collectBookingAdvance, type CollectBookingAdvanceResult } from "@/lib/api/bookings";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { PaymentMethod } from "@/types/domain";

export function useCollectBookingAdvance() {
  const queryClient = useQueryClient();

  return useMutation<
    CollectBookingAdvanceResult,
    ApiError,
    { bookingId: string; method: PaymentMethod }
  >({
    meta: { successMessage: "Advance collected." },
    mutationFn: ({ bookingId, method }) => collectBookingAdvance(bookingId, method),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
  });
}
