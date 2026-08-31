import { apiClient } from "@/lib/api/client";
import { normalizePayment, type RawPayment } from "@/lib/api/payments";
import type { Booking, Payment, PaymentMethod } from "@/types/domain";
import type { PaginatedResponse } from "@/types/api";

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

export interface BookingListParams {
  /** Inclusive. The calendar view's month/week window. */
  dateFrom?: string;
  dateTo?: string;
  status?: Booking["status"];
  /** Admin only — narrows to one branch; ignored for a Manager (own branch is forced server-side). */
  branchId?: string;
}

/**
 * The calendar view's data source -- server-side `dateFrom`/`dateTo`
 * filtering with a raised page size (`_CalendarPagination`, 200) so a whole
 * month renders from one request instead of paging through the site-wide
 * default of 10.
 */
export async function listBookings(
  params: BookingListParams = {},
): Promise<PaginatedResponse<Booking>> {
  const { data } = await apiClient.get<PaginatedResponse<RawBooking>>(
    "/enrollments/bookings/",
    {
      params: {
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        status: params.status,
        branch: params.branchId,
      },
    },
  );
  return { ...data, results: data.results.map(normalizeBooking) };
}
