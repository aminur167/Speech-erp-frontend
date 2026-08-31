import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listBookings, type BookingListParams } from "@/lib/api/bookings";

export function useBookings(params: BookingListParams) {
  return useQuery({
    queryKey: queryKeys.bookings.list(params),
    queryFn: () => listBookings(params),
  });
}
