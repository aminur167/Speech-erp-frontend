import { listPayments } from "@/lib/api/payments";
import { listPatients } from "@/lib/api/patients";
import type { PaginatedResponse } from "@/types/api";
import type { Payment, PaymentMethod, PaymentStatus, ServiceCategory } from "@/types/domain";

/**
 * Denormalized "transaction history" view — joins payments with patient
 * records so the UI can show patient name/code without a second round trip.
 * Mirrors what a real backend would return via a joined serializer.
 */

export interface TransactionItem extends Payment {
  patientName: string;
  patientCode: string;
}

export interface TransactionListParams {
  search?: string;
  method?: PaymentMethod;
  status?: PaymentStatus;
  branchId?: string;
  patientId?: string;
  page?: number;
  pageSize?: number;
}

async function joinTransactions(branchId?: string): Promise<TransactionItem[]> {
  const [payments, patientsPage] = await Promise.all([
    listPayments({ branchId }),
    listPatients({ pageSize: 1000 }),
  ]);
  const patientById = new Map(patientsPage.results.map((p) => [p.id, p]));

  return payments.map((payment) => {
    const patient = patientById.get(payment.patientId);
    return {
      ...payment,
      patientName: patient?.name ?? "Unknown patient",
      patientCode: patient?.patientCode ?? "—",
    };
  });
}

export async function listTransactions(
  params: TransactionListParams = {},
): Promise<PaginatedResponse<TransactionItem>> {
  const { search = "", method, status, branchId, patientId, page = 1, pageSize = 10 } = params;
  const query = search.trim().toLowerCase();

  const all = await joinTransactions(branchId);
  const sorted = [...all].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const filtered = sorted.filter((item) => {
    if (patientId && item.patientId !== patientId) return false;
    if (method && item.method !== method) return false;
    if (status && item.status !== status) return false;
    if (!query) return true;
    return (
      item.patientName.toLowerCase().includes(query) ||
      item.patientCode.toLowerCase().includes(query) ||
      item.receiptNumber.toLowerCase().includes(query) ||
      item.transactionId.toLowerCase().includes(query)
    );
  });

  const start = (page - 1) * pageSize;
  const results = filtered.slice(start, start + pageSize);

  return {
    count: filtered.length,
    next: start + pageSize < filtered.length ? String(page + 1) : null,
    previous: page > 1 ? String(page - 1) : null,
    results,
  };
}

export interface TransactionsSummary {
  totalCollected: number;
  transactionCount: number;
  todayCollected: number;
  monthCollected: number;
  byMethod: { method: PaymentMethod; amount: number }[];
}

export async function getTransactionsSummary(branchId?: string): Promise<TransactionsSummary> {
  const all = await joinTransactions(branchId);
  // Refunded/void payments aren't real revenue — exclude them from the totals below.
  const paid = all.filter((item) => item.status === "paid");
  const now = new Date();
  const todayKey = now.toDateString();
  const monthKey = `${now.getFullYear()}-${now.getMonth()}`;

  const byMethodMap = new Map<PaymentMethod, number>();
  for (const item of paid) {
    byMethodMap.set(item.method, (byMethodMap.get(item.method) ?? 0) + item.amount);
  }

  return {
    byMethod: Array.from(byMethodMap.entries())
      .map(([method, amount]) => ({ method, amount }))
      .sort((a, b) => b.amount - a.amount),
    totalCollected: paid.reduce((sum, item) => sum + item.amount, 0),
    transactionCount: all.length,
    todayCollected: paid
      .filter((item) => new Date(item.createdAt).toDateString() === todayKey)
      .reduce((sum, item) => sum + item.amount, 0),
    monthCollected: paid
      .filter((item) => {
        const created = new Date(item.createdAt);
        return `${created.getFullYear()}-${created.getMonth()}` === monthKey;
      })
      .reduce((sum, item) => sum + item.amount, 0),
  };
}

/** Daily collection totals for the last `days` calendar days (oldest first) — powers a revenue trend chart. */
export async function getRevenueTrend(
  branchId: string | undefined,
  days = 7,
): Promise<{ date: string; label: string; amount: number }[]> {
  const all = await joinTransactions(branchId);
  const paid = all.filter((item) => item.status === "paid");

  const buckets: { date: string; label: string; amount: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    day.setHours(0, 0, 0, 0);
    const dayKey = day.toDateString();
    const amount = paid
      .filter((item) => new Date(item.createdAt).toDateString() === dayKey)
      .reduce((sum, item) => sum + item.amount, 0);
    buckets.push({
      date: dayKey,
      label: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      amount,
    });
  }
  return buckets;
}

/** This month's revenue split by payment method — for the Manager Dashboard's method breakdown chart. */
export async function getMonthlyRevenueByMethod(
  branchId?: string,
): Promise<{ method: PaymentMethod; amount: number }[]> {
  const all = await joinTransactions(branchId);
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${now.getMonth()}`;

  const thisMonth = all.filter((item) => {
    if (item.status !== "paid") return false;
    const created = new Date(item.createdAt);
    return `${created.getFullYear()}-${created.getMonth()}` === monthKey;
  });

  const map = new Map<PaymentMethod, number>();
  for (const item of thisMonth) {
    map.set(item.method, (map.get(item.method) ?? 0) + item.amount);
  }
  return Array.from(map.entries())
    .map(([method, amount]) => ({ method, amount }))
    .sort((a, b) => b.amount - a.amount);
}

/** This month's revenue split by service category — for the Manager Dashboard's category chart. */
export async function getRevenueByCategory(
  branchId?: string,
): Promise<{ category: ServiceCategory; amount: number }[]> {
  const all = await joinTransactions(branchId);
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${now.getMonth()}`;

  const thisMonth = all.filter((item) => {
    if (item.status !== "paid" || !item.category || item.category === "material_sale") return false;
    const created = new Date(item.createdAt);
    return `${created.getFullYear()}-${created.getMonth()}` === monthKey;
  });

  const map = new Map<ServiceCategory, number>();
  for (const item of thisMonth) {
    const category = item.category as ServiceCategory;
    map.set(category, (map.get(category) ?? 0) + item.amount);
  }
  return Array.from(map.entries()).map(([category, amount]) => ({ category, amount }));
}

export interface BranchDashboardMetrics {
  todayPatientsSeen: number;
  todayDueCollected: number;
}

/** A couple of "today" metrics that don't fit neatly into the other summary functions. */
export async function getBranchDashboardMetrics(
  branchId?: string,
): Promise<BranchDashboardMetrics> {
  const all = await joinTransactions(branchId);
  const paid = all.filter((item) => item.status === "paid");
  const now = new Date();
  const todayKey = now.toDateString();
  const today = paid.filter((item) => new Date(item.createdAt).toDateString() === todayKey);

  return {
    todayPatientsSeen: new Set(today.map((item) => item.patientId)).size,
    todayDueCollected: today
      .filter((item) => item.category === "monthly" || item.category === "installment")
      .reduce((sum, item) => sum + item.amount, 0),
  };
}

export async function listRefundsAndVoids(branchId?: string): Promise<TransactionItem[]> {
  const all = await joinTransactions(branchId);
  return all
    .filter((item) => item.status === "refunded" || item.status === "void")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
