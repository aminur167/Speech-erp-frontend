import type { Expense, ExpenseCategory, ExpensePaymentMethod, ExpenseStatus } from "@/types/domain";
import type { PaginatedResponse } from "@/types/api";

/**
 * Mock implementation — matches the exact shape/signature this module will have
 * once it calls the real Django/DRF `/expenses/` endpoints. Swap the body of
 * each function for a real `apiClient` call later; callers never change.
 */

/** Expenses at or above this amount require Admin approval instead of being auto-approved. */
export const EXPENSE_AUTO_APPROVE_THRESHOLD = 5000;

let mockExpenses: Expense[] = [
  { id: "e-1", expenseCode: "EXP-2026-00001", category: "rent", amount: 25000, description: "Monthly branch rent", paidTo: "Gulshan Properties Ltd.", paymentMethod: "bank_transfer", isRecurring: true, branchId: "branch-1", submittedBy: "Branch Manager", status: "approved", createdAt: "2026-08-01T09:00:00Z" },
  { id: "e-2", expenseCode: "EXP-2026-00002", category: "utilities", amount: 3200, description: "Electricity bill", paidTo: "DPDC", paymentMethod: "cash", isRecurring: true, branchId: "branch-1", submittedBy: "Branch Manager", status: "approved", createdAt: "2026-08-03T09:00:00Z" },
  { id: "e-3", expenseCode: "EXP-2026-00003", category: "supplies", amount: 1500, description: "Therapy material restock", paidTo: "MediSupply BD", paymentMethod: "cash", isRecurring: false, branchId: "branch-1", submittedBy: "Branch Manager", status: "approved", createdAt: "2026-08-05T09:00:00Z" },
  { id: "e-4", expenseCode: "EXP-2026-00004", category: "equipment", amount: 12000, description: "New audiometer", paidTo: "Dhaka Medical Supplies", paymentMethod: "bank_transfer", isRecurring: false, branchId: "branch-1", submittedBy: "Branch Manager", status: "pending", createdAt: "2026-08-10T09:00:00Z" },
  { id: "e-5", expenseCode: "EXP-2026-00005", category: "maintenance", amount: 2500, description: "AC servicing", paidTo: "CoolCare Services", paymentMethod: "cash", isRecurring: false, branchId: "branch-1", submittedBy: "Branch Manager", status: "approved", createdAt: "2026-08-12T09:00:00Z" },
  { id: "e-6", expenseCode: "EXP-2026-00006", category: "marketing", amount: 8000, description: "Facebook ad campaign", paidTo: "Meta Platforms", paymentMethod: "card", isRecurring: false, branchId: "branch-1", submittedBy: "Branch Manager", status: "pending", createdAt: "2026-08-18T09:00:00Z" },
  { id: "e-7", expenseCode: "EXP-2026-00007", category: "salaries", amount: 45000, description: "Speech therapist salary", paidTo: "Rina Akter", paymentMethod: "bank_transfer", isRecurring: true, branchId: "branch-1", submittedBy: "Branch Manager", status: "approved", createdAt: "2026-08-20T09:00:00Z" },
];

let sequence = mockExpenses.length;

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function generateExpenseCode(): string {
  sequence += 1;
  const year = new Date().getFullYear();
  return `EXP-${year}-${String(sequence).padStart(5, "0")}`;
}

export type SummaryPeriod = "today" | "month" | "";

function isWithinPeriod(isoDate: string, period: SummaryPeriod | undefined): boolean {
  if (!period) return true;
  const date = new Date(isoDate);
  const now = new Date();
  if (period === "today") return date.toDateString() === now.toDateString();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export interface ExpenseListParams {
  search?: string;
  status?: ExpenseStatus;
  category?: ExpenseCategory;
  branchId?: string;
  period?: SummaryPeriod;
  page?: number;
  pageSize?: number;
}

export async function listExpenses(
  params: ExpenseListParams = {},
): Promise<PaginatedResponse<Expense>> {
  const { search = "", status, category, branchId, period, page = 1, pageSize = 10 } = params;
  const query = search.trim().toLowerCase();

  const filtered = mockExpenses.filter((expense) => {
    if (branchId && expense.branchId !== branchId) return false;
    if (status && expense.status !== status) return false;
    if (category && expense.category !== category) return false;
    if (!isWithinPeriod(expense.createdAt, period)) return false;
    if (!query) return true;
    return (
      expense.description.toLowerCase().includes(query) ||
      expense.expenseCode.toLowerCase().includes(query) ||
      expense.paidTo.toLowerCase().includes(query) ||
      expense.category.toLowerCase().includes(query)
    );
  });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const start = (page - 1) * pageSize;
  const results = sorted.slice(start, start + pageSize);

  await delay(null);

  return {
    count: filtered.length,
    next: start + pageSize < filtered.length ? String(page + 1) : null,
    previous: page > 1 ? String(page - 1) : null,
    results,
  };
}

export interface ExpenseSummary {
  total: number;
  todayTotal: number;
  monthTotal: number;
  pendingCount: number;
  voucherCount: number;
}

export async function getExpenseSummary(
  params: { branchId?: string } = {},
): Promise<ExpenseSummary> {
  const { branchId } = params;
  const scoped = mockExpenses.filter((expense) => !branchId || expense.branchId === branchId);

  const now = new Date();
  const todayKey = now.toDateString();
  const monthKey = `${now.getFullYear()}-${now.getMonth()}`;

  const total = scoped.reduce((sum, expense) => sum + expense.amount, 0);
  const todayTotal = scoped
    .filter((expense) => new Date(expense.createdAt).toDateString() === todayKey)
    .reduce((sum, expense) => sum + expense.amount, 0);
  const monthTotal = scoped
    .filter((expense) => {
      const created = new Date(expense.createdAt);
      return `${created.getFullYear()}-${created.getMonth()}` === monthKey;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);
  const pendingCount = scoped.filter((expense) => expense.status === "pending").length;

  await delay(null, 250);

  return { total, todayTotal, monthTotal, pendingCount, voucherCount: scoped.length };
}

export interface CreateExpenseInput {
  category: ExpenseCategory;
  amount: number;
  description: string;
  paidTo: string;
  paymentMethod: ExpensePaymentMethod;
  remarks?: string;
  isRecurring?: boolean;
  branchId: string;
  submittedBy: string;
}

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  await delay(null);
  const newExpense: Expense = {
    id: `e-${Date.now()}`,
    expenseCode: generateExpenseCode(),
    isRecurring: false,
    status: input.amount >= EXPENSE_AUTO_APPROVE_THRESHOLD ? "pending" : "approved",
    createdAt: new Date().toISOString(),
    ...input,
  };
  mockExpenses = [newExpense, ...mockExpenses];
  return newExpense;
}

export async function updateExpenseStatus(
  id: string,
  status: Extract<ExpenseStatus, "approved" | "rejected">,
): Promise<Expense> {
  await delay(null, 250);
  const expense = mockExpenses.find((e) => e.id === id);
  if (!expense) {
    throw { message: "Expense not found.", status: 404 };
  }
  expense.status = status;
  return expense;
}
