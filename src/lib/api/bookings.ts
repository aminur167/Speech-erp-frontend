import { apiClient } from "@/lib/api/client";
import { normalizePayment, type RawPayment } from "@/lib/api/payments";
import type { Booking, Payment, PaymentMethod } from "@/types/domain";

// `advanceAmount` is a real DRF DecimalField, so it crosses the wire as a
// JSON string (COERCE_DECIMAL_TO_STRING) -- normalized here too.
interface RawBooking extends Omit<Booking, "id" | "advanceAmount"> {
  id: number | string;
  advanceAmount: number | string;
}

function normalizeBooking(raw: RawBooking): Booking {
  return { ...raw, id: String(raw.id), advanceAmount: Number(raw.advanceAmount) };
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
    payment: RawPayment;
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
    payment: normalizePayment(data.payment),
  };
}
