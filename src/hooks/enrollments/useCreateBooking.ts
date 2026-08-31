import { useMutation } from "@tanstack/react-query";
import { createBooking, type CreateBookingInput, type CreateBookingResult } from "@/lib/api/bookings";
import type { ApiError } from "@/types/api";

export function useCreateBooking() {
  return useMutation<CreateBookingResult, ApiError, CreateBookingInput>({
    mutationKey: ["createBooking"],
    mutationFn: createBooking,
  });
}
