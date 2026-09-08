/**
 * Salary payment approvals: Manager requests → Admin approves/rejects →
 * Manager disburses, which creates an Expense automatically. Backed by
 * apps/staff's SalaryPaymentViewSet.
 */
import { apiClient } from "@/lib/api/client";
import type { PaginatedResponse } from "@/types/api";
import type { PaymentMethod, SalaryPayment, SalaryPaymentStatus } from "@/types/domain";

// `amount` is a real DRF DecimalField, so it crosses the wire as a JSON
// string (COERCE_DECIMAL_TO_STRING) -- normalized here too, same as id.
interface RawSalaryPayment extends Omit<SalaryPayment, "id" | "amount"> {
  id: number | string;
  amount: number | string;
}
function normalizeSalaryPayment(raw: RawSalaryPayment): SalaryPayment {
  return { ...raw, id: String(raw.id), amount: Number(raw.amount) };
}

export interface SalaryPaymentListParams {
  status?: SalaryPaymentStatus;
  staffId?: string;
  month?: string;
  branchId?: string;
  page?: number;
  pageSize?: number;
}

/** The Admin approval queue -- Manager sees their own branch's requests, Admin sees and can act on all. */
export async function listSalaryPayments(
  params: SalaryPaymentListParams = {},
): Promise<PaginatedResponse<SalaryPayment>> {
  const { data } = await apiClient.get<PaginatedResponse<RawSalaryPayment>>(
    "/staff/salary-payments/",
    {
      params: {
        status: params.status,
        staff: params.staffId,
        month: params.month,
        branch: params.branchId,
        page: params.page,
        pageSize: params.pageSize,
      },
    },
  );
  return { ...data, results: data.results.map(normalizeSalaryPayment) };
}

/**
 * Opens a request for one staff member's one month of salary -- nothing is
 * paid until Admin approves it. The amount is computed server-side from
 * that month's salary and bonuses; the client never sends one, the same
 * separation of duties as a refund request.
 */
export async function requestSalaryPayment(
  staffId: string,
  month: string,
): Promise<SalaryPayment> {
  const { data } = await apiClient.post<RawSalaryPayment>(
    `/staff/${staffId}/request-salary-payment/`,
    { month },
  );
  return normalizeSalaryPayment(data);
}

export interface ReviewSalaryPaymentInput {
  id: string;
  approve: boolean;
  reviewNote?: string;
}

export async function reviewSalaryPayment(input: ReviewSalaryPaymentInput): Promise<SalaryPayment> {
  const { data } = await apiClient.post<RawSalaryPayment>(
    `/staff/salary-payments/${input.id}/review/`,
    { approve: input.approve, reviewNote: input.reviewNote },
  );
  return normalizeSalaryPayment(data);
}

export interface DisburseSalaryPaymentInput {
  id: string;
  paymentMethod: PaymentMethod;
}

export async function disburseSalaryPayment(
  input: DisburseSalaryPaymentInput,
): Promise<SalaryPayment> {
  const { data } = await apiClient.post<RawSalaryPayment>(
    `/staff/salary-payments/${input.id}/disburse/`,
    { paymentMethod: input.paymentMethod },
  );
  return normalizeSalaryPayment(data);
}

export interface SalaryPaymentBranchSummaryRow {
  branchId: string;
  branchName: string;
  /** Approved by Admin, not yet paid out. */
  approvedAmount: number;
  /** Already disbursed -- also logged as an Expense. */
  paidAmount: number;
  /** `approvedAmount + paidAmount` -- everything Admin has signed off on, regardless of disbursement stage. */
  totalApprovedAmount: number;
  paymentCount: number;
}

interface RawSalaryPaymentBranchSummaryRow
  extends Omit<SalaryPaymentBranchSummaryRow, "approvedAmount" | "paidAmount" | "totalApprovedAmount"> {
  approvedAmount: number | string;
  paidAmount: number | string;
  totalApprovedAmount: number | string;
}

/** `month` is an ISO "YYYY-MM"; omit for all-time totals. */
export async function getSalaryPaymentBranchSummary(
  month?: string,
): Promise<SalaryPaymentBranchSummaryRow[]> {
  const { data } = await apiClient.get<RawSalaryPaymentBranchSummaryRow[]>(
    "/staff/salary-payments/branch-summary/",
    { params: { month } },
  );
  return data.map((row) => ({
    ...row,
    approvedAmount: Number(row.approvedAmount),
    paidAmount: Number(row.paidAmount),
    totalApprovedAmount: Number(row.totalApprovedAmount),
  }));
}
