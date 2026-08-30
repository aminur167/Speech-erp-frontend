import { apiClient } from "@/lib/api/client";
import type { Booking, Payment, PaymentMethod } from "@/types/domain";

interface RawBooking extends Omit<Booking, "id"> {
  id: number | string;
}

function normalizeBooking(raw: RawBooking): Booking {
  return { ...raw, id: String(raw.id) };
}

export interface CreateBookingInput {
  patientId: string;
  serviceId: string;
  date: string;
  time: string;
  method: PaymentMethod;
  idempotencyKey?: string;
}

export interface CreateBookingResult {
  booking: Booking;
  payment: Payment;
}

/**
 * One atomic call: the backend creates the booking and charges its advance
 * together (advanceAmount is computed server-side from the service's fee --
 * there's nothing here for a client to tamper with, so it's never sent).
 */
export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const { data } = await apiClient.post<{
    booking: RawBooking;
    payment: Payment & { id: number | string };
  }>("/enrollments/bookings/", {
    patient: input.patientId,
    service: input.serviceId,
    date: input.date,
    time: input.time,
    method: input.method,
    idempotencyKey: input.idempotencyKey,
  });
  return {
    booking: normalizeBooking(data.booking),
    payment: { ...data.payment, id: String(data.payment.id) },
  };
}
