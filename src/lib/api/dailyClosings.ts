import { listPayments } from "@/lib/api/payments";
import type { DailyClosing, PaymentMethod } from "@/types/domain";

/**
 * Mock implementation — matches the shape/signature this module will have
 * once it calls the real Django/DRF `/daily-closings/` endpoints.
 */

let closings: DailyClosing[] = [];

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function todayDateString(): string {
  // Build the date from local components — toISOString() converts to UTC,
  // which rolls back to the previous day for any positive UTC offset.
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface TodayCollectionSummary {
  total: number;
  transactionCount: number;
  byMethod: { method: PaymentMethod; amount: number }[];
}

export async function getTodaySystemCollection(branchId?: string): Promise<TodayCollectionSummary> {
  const todaysPayments = await listPayments({ branchId, since: startOfToday() });

  const byMethodMap = new Map<PaymentMethod, number>();
  for (const payment of todaysPayments) {
    byMethodMap.set(payment.method, (byMethodMap.get(payment.method) ?? 0) + payment.amount);
  }

  return {
    total: todaysPayments.reduce((sum, payment) => sum + payment.amount, 0),
    transactionCount: todaysPayments.length,
    byMethod: Array.from(byMethodMap.entries()).map(([method, amount]) => ({ method, amount })),
  };
}

export async function listDailyClosings(branchId?: string): Promise<DailyClosing[]> {
  await delay(null, 150);
  const scoped = branchId ? closings.filter((c) => c.branchId === branchId) : closings;
  return [...scoped].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export interface SubmitDailyClosingInput {
  branchId: string;
  actualTotal: number;
  submittedBy: string;
}

export async function submitDailyClosing(input: SubmitDailyClosingInput): Promise<DailyClosing> {
  const summary = await getTodaySystemCollection(input.branchId);
  await delay(null, 350);

  const difference = input.actualTotal - summary.total;
  const closing: DailyClosing = {
    id: `close-${Date.now()}`,
    branchId: input.branchId,
    date: todayDateString(),
    systemTotal: summary.total,
    actualTotal: input.actualTotal,
    difference,
    status: difference === 0 ? "matched" : difference > 0 ? "over" : "short",
    submittedBy: input.submittedBy,
    submittedAt: new Date().toISOString(),
  };
  closings = [closing, ...closings];
  return closing;
}
