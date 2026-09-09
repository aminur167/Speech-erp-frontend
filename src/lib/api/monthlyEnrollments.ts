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

export async function terminateMonthlyEnrollment(
  enrollmentId: string,
): Promise<MonthlyEnrollment> {
  const { data } = await apiClient.post<RawEnrollment>(
    `/enrollments/monthly/${enrollmentId}/terminate/`,
  );
  return normalizeEnrollment(data);
}

/**
 * A monthly service that is no longer running — the rows behind the
 * Terminated Services screen.
 *
 * Both kinds appear. `terminatedKind` says which: "unpaid_due" is the
 * nightly job acting on a month's due that was never cleared, "manual" is a
 * manager stopping it. What differs is only what resuming costs — stopping
 * it by hand already wrote the debt off, so there is nothing left to collect.
 */
export interface TerminatedMonthlyService {
  id: string;
  patientId: string;
  patientCode: string;
  patientName: string;
  patientPhone: string;
  serviceId: string;
  serviceCode: string;
  serviceName: string;
  monthlyFee: number;
  branchId: string;
  status: string;
  /** ISO datetime the service was stopped. */
  terminatedAt: string;
  /** The cycle whose unpaid due ended it, as "YYYY-MM". Blank for a manual stop. */
  terminatedMonth: string;
  terminatedMonthLabel: string;
  terminatedKind: TerminationKind | string;
  /** Everything still owed — what "resume with previous due" would collect. */
  previousDue: number;
  /** The month labels that due is made up of. */
  unpaidMonths: string[];
  createdAt: string;
}

// `monthlyFee` and `previousDue` are DRF DecimalFields, so they arrive as
// JSON strings; converted here rather than trusted, same as everywhere else.
interface RawTerminatedService
  extends Omit<TerminatedMonthlyService, "id" | "monthlyFee" | "previousDue"> {
  id: number | string;
  monthlyFee: number | string;
  previousDue: number | string;
}

function normalizeTerminated(raw: RawTerminatedService): TerminatedMonthlyService {
  return {
    ...raw,
    id: String(raw.id),
    monthlyFee: Number(raw.monthlyFee),
    previousDue: Number(raw.previousDue),
  };
}

/** Who stopped it: the nightly unpaid-due job, or a manager. */
export type TerminationKind = "unpaid_due" | "manual";

export interface TerminatedServiceListParams {
  /** Patient name, patient code, phone, or service code/name. */
  search?: string;
  /** Terminated cycle, as "YYYY-MM". */
  month?: string;
  kind?: TerminationKind;
  branchId?: string;
  page?: number;
  pageSize?: number;
}

export async function listTerminatedServices(
  params: TerminatedServiceListParams = {},
): Promise<PaginatedResponse<TerminatedMonthlyService>> {
  const { data } = await apiClient.get<PaginatedResponse<RawTerminatedService>>(
    "/enrollments/monthly/terminated/",
    {
      params: {
        search: params.search,
        month: params.month,
        kind: params.kind,
        branch: params.branchId,
        page: params.page,
        pageSize: params.pageSize,
      },
    },
  );
  return { ...data, results: data.results.map(normalizeTerminated) };
}

export interface ResumeMonthlyServiceInput {
  id: string;
  /**
   * True collects the previous due before restarting; false waives it. The
   * method is only meaningful for the first, and the backend refuses that one
   * without it rather than taking money by an unnamed method.
   */
  carryDue: boolean;
  method?: string;
}

export interface ResumeMonthlyServiceResult {
  enrollment: MonthlyEnrollment;
  /** One receipt per arrear month settled — empty when the due was waived. */
  payments: Payment[];
}

export async function resumeMonthlyService(
  input: ResumeMonthlyServiceInput,
): Promise<ResumeMonthlyServiceResult> {
  const { data } = await apiClient.post<{
    enrollment: RawEnrollment;
    payments: RawPayment[];
  }>(`/enrollments/monthly/${input.id}/resume/`, {
    carryDue: input.carryDue,
    method: input.carryDue ? input.method : undefined,
  });
  return {
    enrollment: normalizeEnrollment(data.enrollment),
    payments: data.payments.map(normalizePayment),
  };
}

// ---------------------------------------------------------------------------
// Advance payment — collecting months before they arrive
// ---------------------------------------------------------------------------

export interface AdvanceMonth {
  month: string;
  label: string;
  amount: number;
  /** Already owed, as opposed to a month being paid ahead. */
  isArrears: boolean;
}

export interface AdvancePreview {
  months: AdvanceMonth[];
  total: number;
  /** Called out separately so "pay through December" never hides an unpaid September. */
  arrearsTotal: number;
  monthsAhead: number;
}

export async function previewMonthlyAdvance(
  enrollmentId: string,
  throughMonth: string,
): Promise<AdvancePreview> {
  const { data } = await apiClient.get<Record<string, unknown>>(
    `/enrollments/monthly/${enrollmentId}/advance-preview/`,
    { params: { through: throughMonth } },
  );

  const months = ((data.months ?? []) as Record<string, unknown>[]).map((row) => ({
    month: String(row.month),
    label: String(row.label),
    amount: Number(row.amount),
    isArrears: Boolean(row.isArrears),
  }));

  return {
    months,
    total: Number(data.total ?? 0),
    arrearsTotal: Number(data.arrearsTotal ?? 0),
    monthsAhead: Number(data.monthsAhead ?? 0),
  };
}

export interface CollectAdvanceInput {
  enrollmentId: string;
  throughMonth: string;
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
  }>(`/enrollments/monthly/${input.enrollmentId}/pay-through/`, {
    throughMonth: input.throughMonth,
    method: input.method,
    idempotencyKey: input.idempotencyKey,
  });

  return {
    payments: data.payments.map(normalizePayment),
    enrollment: normalizeEnrollment(data.enrollment),
  };
}

// ---------------------------------------------------------------------------
// Stopping one service, month by month
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
  /** Never payable, never paid — dropped rather than decided. */
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
  /** Required for a waive — the record exists so Admin can see why the debt dropped. */
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
