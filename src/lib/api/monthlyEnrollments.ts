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
 * A monthly service the nightly job stopped because a month's due was never
 * cleared — the rows behind the Terminated Services screen.
 *
 * Only that kind appears: a service a manager stopped by hand already had its
 * debt written off and was closed deliberately, so there is nothing to
 * collect and nothing to reinstate.
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
  /** The cycle whose unpaid due ended it, as "YYYY-MM". */
  terminatedMonth: string;
  terminatedMonthLabel: string;
  terminatedKind: string;
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

export interface TerminatedServiceListParams {
  /** Patient name, patient code, phone, or service code/name. */
  search?: string;
  /** Terminated cycle, as "YYYY-MM". */
  month?: string;
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
