import { apiClient } from "@/lib/api/client";
import { toSnakeCase } from "@/lib/api/caseUtils";
import type { Expense, ExpenseCategory, ExpensePaymentMethod, ExpenseStatus } from "@/types/domain";
import type { PaginatedResponse } from "@/types/api";

/** Expenses at or above this amount require Admin approval instead of being auto-approved. Mirrors EXPENSE_AUTO_APPROVE_THRESHOLD on the backend, which is what actually decides -- this is display-only. */
export const EXPENSE_AUTO_APPROVE_THRESHOLD = 5000;

interface RawExpense extends Omit<Expense, "id" | "amount"> {
  id: number | string;
  amount: number | string;
}
function normalizeExpense(raw: RawExpense): Expense {
  return { ...raw, id: String(raw.id), amount: Number(raw.amount) };
}

export type SummaryPeriod = "today" | "month" | "";

export interface ExpenseListParams {
  search?: string;
  status?: ExpenseStatus;
  category?: ExpenseCategory;
  branchId?: string;
  period?: SummaryPeriod;
  /** Exact calendar date (ISO "YYYY-MM-DD") from a date picker — overrides `period` when set. */
  date?: string;
  page?: number;
  pageSize?: number;
}

export async function listExpenses(
  params: ExpenseListParams = {},
): Promise<PaginatedResponse<Expense>> {
  const { data } = await apiClient.get<PaginatedResponse<RawExpense>>("/expenses/", {
    params: {
      search: params.search,
      status: params.status,
      category: params.category,
      branch: params.branchId,
      period: params.period || undefined,
      date: params.date,
      page: params.page,
      pageSize: params.pageSize,
    },
  });
  return { ...data, results: data.results.map(normalizeExpense) };
}

export interface ExpenseSummary {
  total: number;
  todayTotal: number;
  monthTotal: number;
  pendingAmount: number;
  pendingCount: number;
  voucherCount: number;
}

interface RawExpenseSummary
  extends Omit<ExpenseSummary, "total" | "todayTotal" | "monthTotal" | "pendingAmount"> {
  // ExpenseSummarySerializer's DecimalField amounts cross the wire as strings
  // (DRF's default COERCE_DECIMAL_TO_STRING), so this must convert before the
  // UI does arithmetic or currency formatting on it.
  total: number | string;
  todayTotal: number | string;
  monthTotal: number | string;
  pendingAmount: number | string;
}

function normalizeExpenseSummary(raw: RawExpenseSummary): ExpenseSummary {
  return {
    ...raw,
    total: Number(raw.total),
    todayTotal: Number(raw.todayTotal),
    monthTotal: Number(raw.monthTotal),
    pendingAmount: Number(raw.pendingAmount),
  };
}

/** `date` (an ISO "YYYY-MM-DD" from a date picker) defaults to today when omitted. */
export async function getExpenseSummary(
  params: { branchId?: string; date?: string } = {},
): Promise<ExpenseSummary> {
  const { data } = await apiClient.get<RawExpenseSummary>("/expenses/summary/", {
    params: { branch: params.branchId, date: params.date },
  });
  return normalizeExpenseSummary(data);
}

/** Total expenses recorded on one specific calendar date — powers the Reports date-picker view. */
export async function getExpenseTotalForDate(
  branchId: string | undefined,
  date: string,
): Promise<number> {
  const summary = await getExpenseSummary({ branchId, date });
  return summary.todayTotal;
}

export interface CreateExpenseInput {
  category: ExpenseCategory;
  amount: number;
  description: string;
  paidTo: string;
  paymentMethod: ExpensePaymentMethod;
  remarks?: string;
  isRecurring?: boolean;
}

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  // No branchId/submittedBy: the backend derives both from the authenticated
  // manager, and computes status itself from the amount vs the configured
  // threshold -- never trusts a client-posted status.
  const { data } = await apiClient.post<RawExpense>("/expenses/", toSnakeCase(input));
  return normalizeExpense(data);
}

export interface ReviewExpenseInput {
  id: string;
  approve: boolean;
  /** Required when rejecting, and when reversing any earlier decision (docs/08). */
  reviewNote?: string;
}

export async function reviewExpense(input: ReviewExpenseInput): Promise<Expense> {
  const { data } = await apiClient.post<RawExpense>(`/expenses/${input.id}/review/`, {
    approve: input.approve,
    reviewNote: input.reviewNote,
  });
  return normalizeExpense(data);
}
