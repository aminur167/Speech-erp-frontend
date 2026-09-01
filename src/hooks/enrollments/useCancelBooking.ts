import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelBooking } from "@/lib/api/bookings";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { Booking } from "@/types/domain";

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation<Booking, ApiError, { bookingId: string; reason?: string }>({
    mutationFn: ({ bookingId, reason }) => cancelBooking(bookingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
  });
}
