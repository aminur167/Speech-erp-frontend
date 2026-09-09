import { apiClient } from "@/lib/api/client";
import { normalizePayment, type RawPayment } from "@/lib/api/payments";
import type { PaginatedResponse } from "@/types/api";
import type { MonthlyEnrollment, MonthlyBill, Payment } from "@/types/domain";

// MonthlyEnrollment/MonthlyBill both have integer primary keys, while every
// place that refers to one elsewhere (Payment.serviceId, etc.) is a string --
// same reasoning as Branch/Service. Normalized on the way in.
//
// `amount`/`amountPaid`/`outstanding` are real DRF DecimalFields, which cross
// the wire as JSON strings (COERCE_DECIMAL_TO_STRING) -- normalized to
// numbers here too, the same as the id fields.
interface RawBill extends Omit<MonthlyBill, "id" | "amount" | "amountPaid" | "outstanding"> {
  id: number | string;
  amount: number | string;
  amountPaid: number | string;
  outstanding: number | string;
}
interface RawEnrollment extends Omit<MonthlyEnrollment, "id" | "bills"> {
  id: number | string;
  bills: RawBill[];
}

function normalizeBill(bill: RawBill): MonthlyBill {
  return {
    ...bill,
    id: String(bill.id),
    amount: Number(bill.amount),
    amountPaid: Number(bill.amountPaid),
    outstanding: Number(bill.outstanding),
  };
}

function normalizeEnrollment(raw: RawEnrollment): MonthlyEnrollment {
  return {
    ...raw,
    id: String(raw.id),
    bills: raw.bills.map(normalizeBill),
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
  const { data } = await apiClient.post<{ payment: RawPayment; enrollment: RawEnrollment }>(
    `/enrollments/monthly/${enrollmentId}/bills/${billId}/pay/`,
    { method, idempotencyKey },
  );
  return {
    payment: normalizePayment(data.payment),
    enrollment: normalizeEnrollment(data.enrollment),
  };
}



/**
 * Reactivate an inactive service.
 *
 * No options: the backend refuses while the patient owes anything, so the
 * arrears are cleared on Due Payments first. The old "resume and waive the
 * due" branch is gone — it let a due that had survived an explicit keep
 * decision be forgiven later with no fresh justification.
 */
export async function resumeMonthlyService(
  enrollmentId: string,
): Promise<MonthlyEnrollment> {
  const { data } = await apiClient.post<RawEnrollment>(
    `/enrollments/monthly/${enrollmentId}/resume/`,
    {},
  );
  return normalizeEnrollment(data);
}

// ---------------------------------------------------------------------------
// Advance payment — paying named future months before they arrive
// ---------------------------------------------------------------------------

export interface AdvanceMonthOption {
  month: string;
  label: string;
  amount: number;
  /** Already settled: shown, but not tickable. */
  covered: boolean;
  status: string;
}

export interface OutstandingDueItem {
  type: "monthly" | "installment";
  refId: string;
  itemId: string;
  serviceName: string;
  month: string;
  label: string;
  amount: number;
  /** False for a due kept when the service was made inactive — still owed. */
  serviceActive: boolean;
}

export interface AdvanceOptions {
  months: AdvanceMonthOption[];
  fee: number;
  /** Why Confirm may be disabled: nothing is paid ahead while anything is owed. */
  outstandingTotal: number;
  outstandingItems: OutstandingDueItem[];
}

export function normalizeOutstandingItem(
  raw: Record<string, unknown>,
): OutstandingDueItem {
  return {
    type: raw.type === "installment" ? "installment" : "monthly",
    refId: String(raw.refId),
    itemId: String(raw.itemId),
    serviceName: String(raw.serviceName ?? ""),
    month: String(raw.month ?? ""),
    label: String(raw.label ?? ""),
    amount: Number(raw.amount ?? 0),
    serviceActive: Boolean(raw.serviceActive),
  };
}

export async function getAdvanceOptions(enrollmentId: string): Promise<AdvanceOptions> {
  const { data } = await apiClient.get<Record<string, unknown>>(
    `/enrollments/monthly/${enrollmentId}/advance-options/`,
  );

  return {
    months: ((data.months ?? []) as Record<string, unknown>[]).map((row) => ({
      month: String(row.month),
      label: String(row.label),
      amount: Number(row.amount),
      covered: Boolean(row.covered),
      status: String(row.status ?? ""),
    })),
    fee: Number(data.fee ?? 0),
    outstandingTotal: Number(data.outstandingTotal ?? 0),
    outstandingItems: ((data.outstandingItems ?? []) as Record<string, unknown>[]).map(
      normalizeOutstandingItem,
    ),
  };
}

export interface AdvancePreviewMonth {
  month: string;
  label: string;
  amount: number;
}

export interface AdvancePreview {
  months: AdvancePreviewMonth[];
  total: number;
}

export async function previewMonthlyAdvance(
  enrollmentId: string,
  months: string[],
): Promise<AdvancePreview> {
  const { data } = await apiClient.get<Record<string, unknown>>(
    `/enrollments/monthly/${enrollmentId}/advance-preview/`,
    { params: { months: months.join(",") } },
  );

  return {
    months: ((data.months ?? []) as Record<string, unknown>[]).map((row) => ({
      month: String(row.month),
      label: String(row.label),
      amount: Number(row.amount),
    })),
    total: Number(data.total ?? 0),
  };
}

export interface CollectAdvanceInput {
  enrollmentId: string;
  /** The months the manager ticked — not a range; November may be skipped. */
  months: string[];
  method: string;
  idempotencyKey?: string;
}

/** One receipt per month — the point of collecting them separately. */
export async function collectMonthlyAdvance(
  input: CollectAdvanceInput,
): Promise<{ payments: Payment[]; enrollment: MonthlyEnrollment }> {
  const { data } = await apiClient.post<{
    payments: RawPayment[];
    enrollment: RawEnrollment;
  }>(`/enrollments/monthly/${input.enrollmentId}/pay-advance/`, {
    months: input.months,
    method: input.method,
    idempotencyKey: input.idempotencyKey,
  });

  return {
    payments: data.payments.map(normalizePayment),
    enrollment: normalizeEnrollment(data.enrollment),
  };
}

// ---------------------------------------------------------------------------
// Making one service inactive, month by month
// ---------------------------------------------------------------------------

export interface StoppableMonth {
  billId: string;
  month: string;
  label: string;
  amount: number;
  status: string;
}

export interface StopPreview {
  /** Arrived and unpaid — each needs a keep-or-waive decision. */
  owed: StoppableMonth[];
  owedTotal: number;
  /** Money already taken for service that will now not be delivered. */
  prepaid: StoppableMonth[];
  prepaidTotal: number;
  /** Never payable, never paid — dropped rather than decided. Empty now that
   * future months are not created until they arrive, but kept so an older
   * backend still renders correctly. */
  droppedMonths: string[];
}

function normalizeStoppable(raw: Record<string, unknown>): StoppableMonth {
  return {
    billId: String(raw.billId),
    month: String(raw.month),
    label: String(raw.label),
    amount: Number(raw.amount),
    status: String(raw.status),
  };
}

export async function previewStopService(enrollmentId: string): Promise<StopPreview> {
  const { data } = await apiClient.get<Record<string, unknown>>(
    `/enrollments/monthly/${enrollmentId}/stop-preview/`,
  );
  return {
    owed: ((data.owed ?? []) as Record<string, unknown>[]).map(normalizeStoppable),
    owedTotal: Number(data.owedTotal ?? 0),
    prepaid: ((data.prepaid ?? []) as Record<string, unknown>[]).map(normalizeStoppable),
    prepaidTotal: Number(data.prepaidTotal ?? 0),
    droppedMonths: (data.droppedMonths ?? []) as string[],
  };
}

export interface StopDecision {
  billId: string;
  action: "keep" | "waive";
  /** Required to cancel — the record exists so Admin can see why the debt dropped. */
  reason?: string;
}

export async function stopMonthlyService(input: {
  enrollmentId: string;
  decisions: StopDecision[];
  reason?: string;
}): Promise<MonthlyEnrollment> {
  const { data } = await apiClient.post<RawEnrollment>(
    `/enrollments/monthly/${input.enrollmentId}/stop/`,
    {
      decisions: input.decisions.map((decision) => ({
        billId: Number(decision.billId),
        action: decision.action,
        reason: decision.reason,
      })),
      reason: input.reason,
    },
  );
  return normalizeEnrollment(data);
}
