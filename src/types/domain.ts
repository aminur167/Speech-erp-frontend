export type UserRole = "admin" | "manager";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branchId: string | null;
}

export type BranchStatus = "active" | "inactive";

export interface Branch {
  id: string;
  name: string;
  code: string; // e.g. BR-DHK-001
  status: BranchStatus;
  address: string;
  phone: string;
  managerName: string;
  managerCode: string; // e.g. MGR-DHK-001
  /** Login used by this branch's manager account — set by Admin when creating/editing the branch. */
  managerEmail: string;
  therapistCount: number;
  supportCount: number;
  openedAt: string; // ISO date
}

export type Gender = "male" | "female" | "other";
export type GuardianRelation = "father" | "mother" | "guardian" | "other";

export interface Patient {
  id: string;
  patientCode: string; // e.g. PT-2026-00125
  name: string;
  phone: string;
  email?: string;
  gender?: Gender;
  dateOfBirth?: string;
  guardianName?: string;
  guardianRelation?: GuardianRelation;
  /** Required when the patient is a minor (docs/02). */
  guardianPhone?: string;
  address?: string;
  branchId: string;
  createdAt: string;
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
  /** "Before discount" price — when set and greater than `fee`, the card shows it struck through. */
  originalFee?: number;
  /** Free-text duration, e.g. "1 Day", "3 Days – 3 Months", "1 Month (auto-renew)". */
  durationLabel?: string;
  /** Free-text session count, e.g. "1 Session", "12 Sessions". */
  sessionsLabel?: string;
  /** Free-text validity/expiry policy, e.g. "3 months from purchase". */
  expiryLabel?: string;
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

/** A Payment's category is usually a service category, but can also mark a retail material sale. */
export type PaymentCategory = ServiceCategory | "material_sale";

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
  /** Which service category (or material sale) this payment was collected for — powers revenue reporting. */
  category?: PaymentCategory;
  createdAt: string;
}

export type ExpenseCategory =
  | "rent"
  | "utilities"
  | "salaries"
  | "supplies"
  | "equipment"
  | "maintenance"
  | "marketing"
  | "other";

export type ExpenseStatus = "pending" | "approved" | "rejected";

export type ExpensePaymentMethod = PaymentMethod;

export interface Expense {
  id: string;
  expenseCode: string; // e.g. EXP-2026-00042
  category: ExpenseCategory;
  amount: number;
  description: string;
  paidTo: string;
  paymentMethod: ExpensePaymentMethod;
  remarks?: string;
  isRecurring: boolean;
  branchId: string;
  submittedBy: string;
  status: ExpenseStatus;
  createdAt: string;
}

export type BillStatus = "paid" | "due" | "upcoming";

export interface MonthlyBill {
  month: string; // e.g. "2026-08"
  label: string; // e.g. "August 2026"
  amount: number;
  status: BillStatus;
  /** Set the moment this bill is marked paid — lets a past date be checked for whether it was still outstanding then. */
  paidAt?: string;
}

export type EnrollmentStatus = "active" | "terminated";

export interface MonthlyEnrollment {
  id: string;
  patientId: string;
  serviceId: string;
  branchId: string;
  bills: MonthlyBill[];
  status: EnrollmentStatus;
  createdAt: string;
}

export interface Installment {
  index: number;
  label: string; // e.g. "1st Installment"
  amount: number;
  status: BillStatus;
  /** Set the moment this installment is marked paid — lets a past date be checked for whether it was still outstanding then. */
  paidAt?: string;
}

export interface InstallmentPlan {
  id: string;
  patientId: string;
  serviceId: string;
  branchId: string;
  totalAmount: number;
  installments: Installment[];
  status: EnrollmentStatus;
  createdAt: string;
}

export interface Booking {
  id: string;
  bookingCode: string; // e.g. BKG-2026-00001
  patientId: string;
  serviceId: string;
  branchId: string;
  date: string;
  time: string;
  advanceAmount: number;
  status: "confirmed" | "cancelled";
}

export type DailyClosingStatus = "matched" | "over" | "short";

export interface DailyClosing {
  id: string;
  branchId: string;
  date: string; // e.g. "2026-08-27"
  systemTotal: number;
  actualTotal: number;
  difference: number;
  status: DailyClosingStatus;
  submittedBy: string;
  submittedAt: string;
}

export type MaterialUnit = "piece" | "box" | "packet" | "set" | "bottle" | "other";

export interface Material {
  id: string;
  name: string;
  code: string; // e.g. MAT-00001
  /** Product photo. A path under /materials for seeded items, or a data URL for one uploaded through the form. */
  imageUrl?: string;
  unit: MaterialUnit;
  quantity: number;
  unitCost: number;
  /** Retail price charged when this material is sold to a patient — separate from unitCost to allow markup. */
  sellingPrice: number;
  reorderLevel: number;
  branchId: string;
  createdAt: string;
}

export type MaterialMovementType = "in" | "out";

export interface MaterialMovement {
  id: string;
  materialId: string;
  type: MaterialMovementType;
  quantity: number;
  note?: string;
  branchId: string;
  createdBy: string;
  createdAt: string;
}
