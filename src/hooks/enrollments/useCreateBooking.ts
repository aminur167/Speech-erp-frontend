import { useMutation } from "@tanstack/react-query";
import { createBooking, type CreateBookingInput } from "@/lib/api/bookings";
import type { ApiError } from "@/types/api";
import type { Booking } from "@/types/domain";

export function useCreateBooking() {
  return useMutation<Booking, ApiError, CreateBookingInput>({
    mutationFn: createBooking,
  });
}
