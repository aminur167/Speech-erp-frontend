import { apiClient } from "@/lib/api/client";
import type { PaginatedResponse } from "@/types/api";
import type { Payment, PaymentCategory, PaymentMethod } from "@/types/domain";

// Payment has an integer primary key, while every place that refers to one
// (e.g. RefundRequest.payment) would be a string — same reasoning as
// Branch/Service. Normalized here, and exported so refunds.ts can reuse it
// for the payment nested inside a RefundRequest.
//
// `amount` is a real DRF DecimalField, so it crosses the wire as a JSON
// string (COERCE_DECIMAL_TO_STRING) -- normalized to a number here too, the
// same as the id field, so formatCurrency() always receives a real number.
export interface RawPayment
  extends Omit<
    Payment,
    "id" | "amount" | "dueAfter" | "grossAmount" | "discountAmount"
  > {
  id: number | string;
  amount: number | string;
  dueAfter?: number | string | null;
  grossAmount?: number | string | null;
  discountAmount?: number | string;
}

export function normalizePayment(raw: RawPayment): Payment {
  return {
    ...raw,
    id: String(raw.id),
    amount: Number(raw.amount),
    // `== null`: Number(null) is 0, which would print "Remaining due ৳0" on
    // receipts that simply have no figure.
    dueAfter: raw.dueAfter == null ? null : Number(raw.dueAfter),
    // Same `== null` reason: a receipt with no discount must not strike
    // through a gross of 0.
    grossAmount: raw.grossAmount == null ? null : Number(raw.grossAmount),
    discountAmount: Number(raw.discountAmount ?? 0),
  };
}

export interface ChargeDailySessionInput {
  patientId: string;
  serviceId: string;
  method: PaymentMethod;
  /** Off the catalogue fee. Omitted when nothing was discounted. */
  discount?: number;
  discountReason?: string;
  idempotencyKey?: string;
}

/**
 * Charge one daily session.
 *
 * No `amount`. This screen used to post its own figure to `/payments/`,
 * which meant a discount was given by typing a smaller number and nothing
 * recorded that one had been given, how much, or why -- missing from the
 * receipt, the branch report and the audit trail alike. The fee now comes
 * from the catalogue and the discount is checked against it server-side
 * (backend docs/12-discounts.md).
 */
export async function chargeDailySession(
  input: ChargeDailySessionInput,
): Promise<Payment> {
  const { data } = await apiClient.post<RawPayment>("/enrollments/daily/", {
    patient: input.patientId,
    service: input.serviceId,
    method: input.method,
    discount: input.discount,
    discountReason: input.discountReason,
    idempotencyKey: input.idempotencyKey,
  });
  return normalizePayment(data);
}

export interface CreatePaymentInput {
  patientId: string;
  amount: number;
  method: PaymentMethod;
  category?: PaymentCategory;
  /** Client-generated per user action -- a retry or replayed offline mutation
   *  returns the original payment instead of charging twice. */
  idempotencyKey?: string;
}

export async function createPayment(input: CreatePaymentInput): Promise<Payment> {
  // patient (not patientId), and no status/collectedBy/branchId -- the
  // backend always marks a direct payment "paid", and derives who collected
  // it and which branch from the authenticated manager, never the body.
  const { data } = await apiClient.post<RawPayment>("/payments/", {
    patient: input.patientId,
    amount: input.amount,
    method: input.method,
    category: input.category,
    idempotencyKey: input.idempotencyKey,
  });
  return normalizePayment(data);
}

export async function getPayment(id: string): Promise<Payment> {
  const { data } = await apiClient.get<RawPayment>(`/payments/${id}/`);
  return normalizePayment(data);
}

export interface ListPaymentsParams {
  branchId?: string;
}

export async function listPayments(params: ListPaymentsParams = {}): Promise<Payment[]> {
  const { data } = await apiClient.get<PaginatedResponse<RawPayment>>("/payments/", {
    params: { branch: params.branchId, pageSize: 500 },
  });
  return data.results.map(normalizePayment);
}

/**
 * Cancels a payment that never really happened -- same calendar day only for
 * a Manager, and only before that day's closing is submitted; Admin may void
 * any day (docs/04). The backend enforces both cutoffs itself and returns a
 * 403 with a code identifying which one tripped, surfaced via ApiError like
 * any other rejection.
 */
export async function voidPayment(paymentId: string, reason: string): Promise<Payment> {
  const { data } = await apiClient.post<RawPayment>(`/payments/${paymentId}/void/`, { reason });
  return normalizePayment(data);
}
