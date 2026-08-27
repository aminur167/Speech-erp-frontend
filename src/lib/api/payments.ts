import type { Payment, PaymentMethod, PaymentStatus } from "@/types/domain";

/**
 * Mock implementation — matches the exact shape/signature this module will have
 * once it calls the real Django/DRF `/payments/` endpoints. Swap the body of
 * each function for a real `apiClient` call later; callers never change.
 */

let mockPayments: Payment[] = [];
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
