import { apiClient } from "@/lib/api/client";
import type { PaginatedResponse } from "@/types/api";
import type { Payment, PaymentCategory, PaymentMethod } from "@/types/domain";

// Payment has an integer primary key, while every place that refers to one
// (e.g. RefundRequest.payment) would be a string — same reasoning as
// Branch/Service. Normalized here, and exported so refunds.ts can reuse it
// for the payment nested inside a RefundRequest.
export interface RawPayment extends Omit<Payment, "id"> {
  id: number | string;
}

export function normalizePayment(raw: RawPayment): Payment {
  return { ...raw, id: String(raw.id) };
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
