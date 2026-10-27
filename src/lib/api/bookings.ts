import { apiClient } from "@/lib/api/client";
import { normalizePayment, type RawPayment } from "@/lib/api/payments";
import type { Booking, Payment, PaymentMethod } from "@/types/domain";
import type { PaginatedResponse } from "@/types/api";

// The money fields are real DRF DecimalFields, so they cross the wire as
// JSON strings (COERCE_DECIMAL_TO_STRING) -- normalized here too.
interface RawBooking
  extends Omit<
    Booking,
    "id" | "advanceAmount" | "feeAmount" | "grossAmount" | "discountAmount"
  > {
  id: number | string;
  advanceAmount: number | string;
  feeAmount?: number | string | null;
  grossAmount?: number | string | null;
  discountAmount?: number | string;
}

function normalizeBooking(raw: RawBooking): Booking {
  return {
    ...raw,
    id: String(raw.id),
    advanceAmount: Number(raw.advanceAmount),
    // `== null` rather than `Number(...)`: a booking taken before the fee
    // was recorded has none, and 0 would read as a free session.
    feeAmount: raw.feeAmount == null ? null : Number(raw.feeAmount),
    grossAmount: raw.grossAmount == null ? null : Number(raw.grossAmount),
    discountAmount: Number(raw.discountAmount ?? 0),
  };
}

export interface CreateBookingInput {
  patientId: string;
  serviceId: string;
  date: string;
  time: string;
  method: PaymentMethod;
  /**
   * How much of the fee to take today -- the manager's figure. Omitted, the
   * server falls back to the ratio this form suggests.
   */
  advanceAmount?: number;
  /** Off the session fee, not off the advance. */
  discount?: number;
  discountReason?: string;
  idempotencyKey?: string;
}

export interface CreateBookingResult {
  booking: Booking;
  /** Null when the advance taken today was nothing — nothing was collected. */
  payment: Payment | null;
}

/**
 * One atomic call: the backend creates the booking and takes its advance
 * together.
 *
 * The advance is sent, the **fee** is not: it comes from the catalogue, and
 * the discount is checked against it server-side. A request may say how
 * much to collect today, never what the session costs (backend
 * docs/12-discounts.md).
 */
export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const { data } = await apiClient.post<{
    booking: RawBooking;
    payment: RawPayment | null;
  }>("/enrollments/bookings/", {
    patient: input.patientId,
    service: input.serviceId,
    date: input.date,
    time: input.time,
    method: input.method,
    advanceAmount: input.advanceAmount,
    discount: input.discount,
    discountReason: input.discountReason,
    idempotencyKey: input.idempotencyKey,
  });
  return {
    booking: normalizeBooking(data.booking),
    payment: data.payment ? normalizePayment(data.payment) : null,
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

/** Never touches the booking's payment — see apps/enrollments/services.py::cancel_booking. */
export async function cancelBooking(bookingId: string, reason?: string): Promise<Booking> {
  const { data } = await apiClient.post<RawBooking>(
    `/enrollments/bookings/${bookingId}/cancel/`,
    { reason },
  );
  return normalizeBooking(data);
}

export interface CollectBookingAdvanceResult {
  booking: Booking;
  payment: Payment;
}

/** A website booking arrives with `advancePaid: false` — this is how a Manager records taking it in person. */
export async function collectBookingAdvance(
  bookingId: string,
  method: PaymentMethod,
): Promise<CollectBookingAdvanceResult> {
  const { data } = await apiClient.post<{ booking: RawBooking; payment: RawPayment }>(
    `/enrollments/bookings/${bookingId}/collect-advance/`,
    { method },
  );
  return {
    booking: normalizeBooking(data.booking),
    payment: normalizePayment(data.payment),
  };
}
