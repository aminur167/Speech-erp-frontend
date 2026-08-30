import { apiClient } from "@/lib/api/client";
import type { PaginatedResponse } from "@/types/api";
import type { MonthlyEnrollment, MonthlyBill, Payment } from "@/types/domain";

// MonthlyEnrollment/MonthlyBill both have integer primary keys, while every
// place that refers to one elsewhere (Payment.serviceId, etc.) is a string --
// same reasoning as Branch/Service. Normalized on the way in.
interface RawBill extends Omit<MonthlyBill, "id"> {
  id: number | string;
}
interface RawEnrollment extends Omit<MonthlyEnrollment, "id" | "bills"> {
  id: number | string;
  bills: RawBill[];
}

function normalizeEnrollment(raw: RawEnrollment): MonthlyEnrollment {
  return {
    ...raw,
    id: String(raw.id),
    bills: raw.bills.map((bill) => ({ ...bill, id: String(bill.id) })),
  };
}

export async function listMonthlyEnrollments(): Promise<MonthlyEnrollment[]> {
  const { data } = await apiClient.get<PaginatedResponse<RawEnrollment>>(
    "/enrollments/monthly/",
    { params: { pageSize: 500 } },
  );
  return data.results.map(normalizeEnrollment);
}

export interface CreateMonthlyEnrollmentInput {
  patientId: string;
  serviceId: string;
}

export async function createMonthlyEnrollment(
  input: CreateMonthlyEnrollmentInput,
): Promise<MonthlyEnrollment> {
  // No branchId/fee: the backend derives the branch from the authenticated
  // manager and the fee from the service's own price, never from the body.
  const { data } = await apiClient.post<RawEnrollment>("/enrollments/monthly/", {
    patient: input.patientId,
    service: input.serviceId,
  });
  return normalizeEnrollment(data);
}

export interface PayMonthlyBillResult {
  payment: Payment;
  enrollment: MonthlyEnrollment;
}

/**
 * Collects a bill in one atomic call -- charges the payment and marks the
 * bill paid together. The mock's two-step "create payment, then mark paid"
 * could take money without ever settling the bill if the second call failed.
 */
export async function payMonthlyBill(
  enrollmentId: string,
  billId: string,
  method: string,
  idempotencyKey?: string,
): Promise<PayMonthlyBillResult> {
  const { data } = await apiClient.post<{ payment: Payment & { id: number | string }; enrollment: RawEnrollment }>(
    `/enrollments/monthly/${enrollmentId}/bills/${billId}/pay/`,
    { method, idempotencyKey },
  );
  return {
    payment: { ...data.payment, id: String(data.payment.id) },
    enrollment: normalizeEnrollment(data.enrollment),
  };
}

export async function terminateMonthlyEnrollment(
  enrollmentId: string,
): Promise<MonthlyEnrollment> {
  const { data } = await apiClient.post<RawEnrollment>(
    `/enrollments/monthly/${enrollmentId}/terminate/`,
  );
  return normalizeEnrollment(data);
}
