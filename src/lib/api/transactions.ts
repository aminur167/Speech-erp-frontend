import { listPayments } from "@/lib/api/payments";
import { listPatients } from "@/lib/api/patients";
import type { PaginatedResponse } from "@/types/api";
import type { Payment, PaymentMethod, PaymentStatus } from "@/types/domain";

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
  const { search = "", method, status, branchId, page = 1, pageSize = 10 } = params;
  const query = search.trim().toLowerCase();

  const all = await joinTransactions(branchId);
  const sorted = [...all].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const filtered = sorted.filter((item) => {
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
}

export async function getTransactionsSummary(branchId?: string): Promise<TransactionsSummary> {
  const all = await joinTransactions(branchId);
  const now = new Date();
  const todayKey = now.toDateString();

  return {
    totalCollected: all.reduce((sum, item) => sum + item.amount, 0),
    transactionCount: all.length,
    todayCollected: all
      .filter((item) => new Date(item.createdAt).toDateString() === todayKey)
      .reduce((sum, item) => sum + item.amount, 0),
  };
}
