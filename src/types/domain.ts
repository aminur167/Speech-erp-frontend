export type UserRole = "admin" | "manager";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branchId: string | null;
}

export interface Branch {
  id: string;
  name: string;
}

export interface Patient {
  id: string;
  patientCode: string; // e.g. PT-2026-00125
  name: string;
  phone: string;
  branchId: string;
}

export type ServiceCategory = "daily" | "monthly" | "installment" | "online";

export interface Service {
  id: string;
  name: string;
  code: string;
  category: ServiceCategory;
  fee: number;
  isOnline: boolean;
  description?: string;
}

export type PaymentStatus =
  | "paid"
  | "due"
  | "upcoming"
  | "partial"
  | "cancelled"
  | "refunded"
  | "void";

export type PaymentMethod =
  | "cash"
  | "bkash"
  | "nagad"
  | "rocket"
  | "bank_transfer"
  | "online_payment"
  | "card";

export interface Payment {
  id: string;
  transactionId: string;
  receiptNumber: string;
  patientId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  collectedBy: string;
  branchId: string;
  createdAt: string;
}
