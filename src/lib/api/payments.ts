import type { Payment, PaymentCategory, PaymentMethod, PaymentStatus } from "@/types/domain";

/**
 * Mock implementation — matches the exact shape/signature this module will have
 * once it calls the real Django/DRF `/payments/` endpoints. Swap the body of
 * each function for a real `apiClient` call later; callers never change.
 */

function hoursAgo(hours: number): string {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
}

function daysAgo(days: number, hour: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

let mockPayments: Payment[] = [
  { id: "pay-seed-1", transactionId: "TXN-seed-1", receiptNumber: "RCPT-2026-00000", patientId: "p-3", amount: 800, method: "cash", status: "paid", category: "daily", collectedBy: "Branch Manager", branchId: "branch-1", createdAt: hoursAgo(5) },
  { id: "pay-seed-2", transactionId: "TXN-seed-2", receiptNumber: "RCPT-2026-00000", patientId: "p-5", amount: 1000, method: "bkash", status: "paid", category: "daily", collectedBy: "Branch Manager", branchId: "branch-1", createdAt: hoursAgo(4) },
  { id: "pay-seed-3", transactionId: "TXN-seed-3", receiptNumber: "RCPT-2026-00000", patientId: "p-9", amount: 500, method: "cash", status: "paid", category: "daily", collectedBy: "Branch Manager", branchId: "branch-1", createdAt: hoursAgo(2) },
  { id: "pay-seed-4", transactionId: "TXN-seed-4", receiptNumber: "RCPT-2026-00000", patientId: "p-1", amount: 800, method: "bkash", status: "paid", category: "daily", collectedBy: "Branch Manager", branchId: "branch-1", createdAt: daysAgo(1, 11) },
  { id: "pay-seed-5", transactionId: "TXN-seed-5", receiptNumber: "RCPT-2026-00000", patientId: "p-2", amount: 1000, method: "cash", status: "paid", category: "monthly", collectedBy: "Branch Manager", branchId: "branch-1", createdAt: daysAgo(2, 15) },
  { id: "pay-seed-6", transactionId: "TXN-seed-6", receiptNumber: "RCPT-2026-00000", patientId: "p-8", amount: 300, method: "nagad", status: "paid", category: "daily", collectedBy: "Branch Manager", branchId: "branch-1", createdAt: daysAgo(3, 10) },
  { id: "pay-seed-7", transactionId: "TXN-seed-7", receiptNumber: "RCPT-2026-00000", patientId: "p-11", amount: 500, method: "card", status: "paid", category: "online", collectedBy: "Branch Manager", branchId: "branch-1", createdAt: daysAgo(5, 13) },
  { id: "pay-seed-8", transactionId: "TXN-seed-8", receiptNumber: "RCPT-2026-00000", patientId: "p-6", amount: 3000, method: "bkash", status: "refunded", category: "monthly", collectedBy: "Branch Manager", branchId: "branch-1", createdAt: daysAgo(4, 12) },
  { id: "pay-seed-9", transactionId: "TXN-seed-9", receiptNumber: "RCPT-2026-00000", patientId: "p-10", amount: 800, method: "cash", status: "void", category: "installment", collectedBy: "Branch Manager", branchId: "branch-1", createdAt: daysAgo(6, 9) },
];
let sequence = 0;

function delay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function generateReceiptNumber(): string {
  sequence += 1;
  const year = new Date().getFullYear();
  return `RCPT-${year}-${String(sequence).padStart(5, "0")}`;
}

export interface CreatePaymentInput {
  patientId: string;
  amount: number;
  method: PaymentMethod;
  status?: PaymentStatus;
  category?: PaymentCategory;
  collectedBy: string;
  branchId: string;
}

export async function createPayment(input: CreatePaymentInput): Promise<Payment> {
  await delay(null);
  const newPayment: Payment = {
    id: `pay-${Date.now()}`,
    transactionId: `TXN-${Date.now()}`,
    receiptNumber: generateReceiptNumber(),
    status: input.status ?? "paid",
    createdAt: new Date().toISOString(),
    ...input,
  };
  mockPayments = [newPayment, ...mockPayments];
  return newPayment;
}

export async function getPayment(id: string): Promise<Payment> {
  await delay(null, 200);
  const payment = mockPayments.find((p) => p.id === id);
  if (!payment) {
    throw { message: "Payment not found.", status: 404 };
  }
  return payment;
}

export interface ListPaymentsParams {
  branchId?: string;
  since?: Date;
}

export async function listPayments(params: ListPaymentsParams = {}): Promise<Payment[]> {
  await delay(null, 150);
  return mockPayments.filter((payment) => {
    if (params.branchId && payment.branchId !== params.branchId) return false;
    if (params.since && new Date(payment.createdAt) < params.since) return false;
    return true;
  });
}
