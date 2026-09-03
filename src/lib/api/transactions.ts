import { apiClient } from "@/lib/api/client";
import type { PaginatedResponse } from "@/types/api";
import type { Payment, PaymentMethod, PaymentStatus, ServiceCategory } from "@/types/domain";

/**
 * Reporting and analytics -- every function here now calls its own dedicated
 * backend aggregate (apps/reporting/) instead of joining payments+patients
 * client-side. That join also hid a real bug: filtering on `status === "paid"`
 * excludes a payment from its own month the instant it's later refunded, even
 * months after the fact -- the backend instead keeps a payment in the period
 * it was collected and books the refund separately by approval date
 * (docs/10), so a refund can never retroactively rewrite a closed month.
 */

export interface TransactionItem extends Payment {
  patientName: string;
  patientCode: string;
}

// PaymentSerializer's `amount` is a real DRF DecimalField, so it crosses the
// wire as a JSON string (COERCE_DECIMAL_TO_STRING) -- normalized here too,
// same as the id field.
interface RawTransactionItem extends Omit<TransactionItem, "id" | "amount"> {
  id: number | string;
  amount: number | string;
}
function normalizeItem(raw: RawTransactionItem): TransactionItem {
  return { ...raw, id: String(raw.id), amount: Number(raw.amount) };
}

export type SummaryPeriod = "today" | "month" | "";

export interface TransactionListParams {
  search?: string;
  method?: PaymentMethod;
  status?: PaymentStatus;
  branchId?: string;
  patientId?: string;
  period?: SummaryPeriod;
  /** Exact calendar date (ISO "YYYY-MM-DD") from a date picker — overrides `period` when set. */
  date?: string;
  page?: number;
  pageSize?: number;
}

export async function listTransactions(
  params: TransactionListParams = {},
): Promise<PaginatedResponse<TransactionItem>> {
  const { data } = await apiClient.get<PaginatedResponse<RawTransactionItem>>(
    "/transactions/",
    {
      params: {
        search: params.search,
        method: params.method,
        status: params.status,
        branch: params.branchId,
        patientId: params.patientId,
        period: params.period || undefined,
        date: params.date,
        page: params.page,
        pageSize: params.pageSize,
      },
    },
  );
  return { ...data, results: data.results.map(normalizeItem) };
}

/** Total collected on one specific calendar date — powers the Reports date-picker view. */
export async function getCollectionForDate(
  branchId: string | undefined,
  date: string,
): Promise<number> {
  const { data } = await apiClient.get<{ date: string; amount: number }>(
    "/transactions/collection-for-date/",
    { params: { branch: branchId, date } },
  );
  return data.amount;
}

export interface TransactionsSummary {
  totalCollected: number;
  transactionCount: number;
  todayCollected: number;
  monthCollected: number;
  byMethod: { method: PaymentMethod; amount: number }[];
}

/** `date` (an ISO "YYYY-MM-DD" from a date picker) defaults to today when omitted. */
export async function getTransactionsSummary(
  branchId?: string,
  date?: string,
): Promise<TransactionsSummary> {
  const { data } = await apiClient.get<TransactionsSummary>("/transactions/summary/", {
    params: { branch: branchId, date },
  });
  return data;
}

/** Daily collection totals for the last `days` calendar days (oldest first) — powers a revenue trend chart. */
export async function getRevenueTrend(
  branchId: string | undefined,
  days = 7,
): Promise<{ date: string; label: string; amount: number }[]> {
  const { data } = await apiClient.get<{ date: string; label: string; amount: number }[]>(
    "/transactions/trend/",
    { params: { branch: branchId, days } },
  );
  return data;
}

/** This month's revenue split by payment method — for the Manager Dashboard's method breakdown chart. */
export async function getMonthlyRevenueByMethod(
  branchId?: string,
): Promise<{ method: PaymentMethod; amount: number }[]> {
  const { data } = await apiClient.get<{ method: PaymentMethod; amount: number }[]>(
    "/transactions/by-method/",
    { params: { branch: branchId } },
  );
  return data;
}

/** This month's revenue split by service category — for the Manager Dashboard's category chart. */
export async function getRevenueByCategory(
  branchId?: string,
): Promise<{ category: ServiceCategory; amount: number }[]> {
  const { data } = await apiClient.get<{ category: ServiceCategory; amount: number }[]>(
    "/transactions/by-category/",
    { params: { branch: branchId } },
  );
  return data;
}

export interface BranchDashboardMetrics {
  todayPatientsSeen: number;
  todayDueCollected: number;
}

/**
 * A couple of per-day metrics that don't fit neatly into the other summary
 * functions. `date` (an ISO "YYYY-MM-DD" from a date picker) defaults to today.
 */
export async function getBranchDashboardMetrics(
  branchId?: string,
  date?: string,
): Promise<BranchDashboardMetrics> {
  const { data } = await apiClient.get<BranchDashboardMetrics>(
    "/transactions/dashboard-metrics/",
    { params: { branch: branchId, date } },
  );
  return data;
}

export async function listRefundsAndVoids(branchId?: string): Promise<TransactionItem[]> {
  const { data } = await apiClient.get<RawTransactionItem[]>("/transactions/refunds-voids/", {
    params: { branch: branchId },
  });
  return data.map(normalizeItem);
}

export interface NetRevenue {
  grossCollected: number;
  refunded: number;
  expenses: number;
  netRevenue: number;
}

/**
 * grossCollected - refunded - expenses, using the same period-attribution
 * rule as everywhere else in this module. Replaces computing
 * `totalCollected - totalExpenses` client-side, which shared the same
 * refund-exclusion bug the rest of this file used to have.
 */
export async function getNetRevenue(branchId?: string, date?: string): Promise<NetRevenue> {
  const { data } = await apiClient.get<NetRevenue>("/transactions/net-revenue/", {
    params: { branch: branchId, date },
  });
  return data;
}

export interface BranchSummaryRow {
  label: string;
  amount: number;
}

export interface BranchSummary {
  dateFrom: string;
  dateTo: string;
  grossCollected: number;
  refunded: number;
  expenses: number;
  netRevenue: number;
  outstandingDue: number;
  paymentCount: number;
  patientsSeen: number;
  newPatients: number;
  totalPatients: number;
  expenseCount: number;
  refundCount: number;
  closingsSubmitted: number;
  closingsMismatched: number;
  byMethod: BranchSummaryRow[];
  byCategory: BranchSummaryRow[];
}

/**
 * Everything one branch did between two dates — the Summary page.
 *
 * Every money field is a DRF DecimalField and therefore arrives as a JSON
 * string; they're converted here rather than trusted, because the type says
 * `number` and a string that reaches an arithmetic expression concatenates
 * instead of adding (the bug that made branch revenue totals render NaN).
 */
export async function getBranchSummary(params: {
  branchId?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<BranchSummary> {
  const { data } = await apiClient.get<Record<string, unknown>>(
    "/transactions/branch-summary/",
    {
      params: {
        branch: params.branchId,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      },
    },
  );

  const money = (value: unknown) => Number(value ?? 0);
  const rows = (value: unknown, key: "method" | "category"): BranchSummaryRow[] =>
    ((value ?? []) as Record<string, unknown>[]).map((row) => ({
      label: String(row[key] ?? ""),
      amount: money(row.amount),
    }));

  return {
    dateFrom: String(data.dateFrom),
    dateTo: String(data.dateTo),
    grossCollected: money(data.grossCollected),
    refunded: money(data.refunded),
    expenses: money(data.expenses),
    netRevenue: money(data.netRevenue),
    outstandingDue: money(data.outstandingDue),
    paymentCount: Number(data.paymentCount ?? 0),
    patientsSeen: Number(data.patientsSeen ?? 0),
    newPatients: Number(data.newPatients ?? 0),
    totalPatients: Number(data.totalPatients ?? 0),
    expenseCount: Number(data.expenseCount ?? 0),
    refundCount: Number(data.refundCount ?? 0),
    closingsSubmitted: Number(data.closingsSubmitted ?? 0),
    closingsMismatched: Number(data.closingsMismatched ?? 0),
    byMethod: rows(data.byMethod, "method"),
    byCategory: rows(data.byCategory, "category"),
  };
}
