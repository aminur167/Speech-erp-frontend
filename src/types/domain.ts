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
export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export type PatientStatus = "active" | "inactive";

export interface Patient {
  id: string;
  patientCode: string; // e.g. PT-2026-00125
  name: string;
  phone: string;
  email?: string;
  gender?: Gender;
  bloodGroup?: BloodGroup;
  dateOfBirth?: string;
  guardianName?: string;
  guardianRelation?: GuardianRelation;
  /** Required when the patient is a minor (docs/02). */
  guardianPhone?: string;
  emergencyContact?: string;
  address?: string;
  /** Who referred the patient — a person's name, another clinic, etc. Free text. */
  referredBy?: string;
  /** The reason for the visit / presenting complaint, as given at intake. */
  chiefComplaint?: string;
  nationalId?: string;
  notes?: string;
  status: PatientStatus;
  branchId: string;
  createdAt: string;
  /** Derived, never stored — "overdue" when any active enrollment/plan has an unpaid bill past its due date (docs/05). */
  serviceStatus: "active" | "overdue";
  overdueAmount: number;
  /** The oldest overdue due date, ISO "YYYY-MM-DD" — null when not overdue. */
  overdueSince: string | null;
}

export type ServiceCategory = "daily" | "monthly" | "installment" | "online";

export interface Service {
  id: string;
  branchId: string;
  branchName: string;
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
  /** Retired from sale — hidden from the enrollment wizards, but existing enrollments keep billing (docs/03). */
  isActive: boolean;
  /** A Manager's proposed package starts "pending" and is invisible to enrollment until Admin reviews it. Admin's own creates are "approved" immediately. */
  reviewStatus: "approved" | "pending" | "rejected";
  proposedBy?: string;
  reviewNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  /** Relative path to navigate to on click, e.g. "/admin/services" — blank if there's nowhere useful to go. */
  link: string;
  isRead: boolean;
  createdAt: string;
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

export type RefundRequestStatus = "pending" | "approved" | "rejected";
/** What happens to the bill/enrollment once the refund is approved. */
export type RefundBillAction = "reopen" | "write_off";

export interface RefundRequestItem {
  id: string;
  material: string;
  materialName: string;
  quantity: number;
  unitPrice: number;
}

export interface RefundRequest {
  id: string;
  payment: Payment;
  amount: number;
  reason: string;
  status: RefundRequestStatus;
  /** Present only for a partial material-sale refund — which lines/quantities are being returned. */
  items: RefundRequestItem[];
  requestedBy: string;
  requestedAt: string;
  reviewedBy: string;
  reviewedAt: string | null;
  reviewNote: string;
  billAction: RefundBillAction;
  refundMethod: string;
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
  /** Set by whoever approved/rejected — required when rejecting or reversing an earlier decision (docs/08). */
  reviewNote?: string;
  reviewedBy?: string;
  reviewedAt?: string | null;
  createdAt: string;
}

// "overdue" is derived server-side from the due date, never stored — it can
// still be the currently-payable item, so anywhere that finds "the bill to
// pay" must treat "due" and "overdue" the same way. "written_off" is the
// admin-approved way to forgive an uncollectable bill (docs/04) and is
// excluded from what's payable, same as "paid".
export type BillStatus = "paid" | "due" | "overdue" | "upcoming" | "written_off";

export interface MonthlyBill {
  id: string;
  month: string; // e.g. "2026-08"
  label: string; // e.g. "August 2026"
  amount: number;
  /** How much of `amount` has actually been settled — less than `amount` after a partial refund. */
  amountPaid: number;
  /** `amount - amountPaid` — what's still owed. Zero for `written_off`, since nobody owes that. */
  outstanding: number;
  status: BillStatus;
  dueDate: string;
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
  id: string;
  index: number;
  label: string; // e.g. "1st Installment"
  amount: number;
  /** How much of `amount` has actually been settled — less than `amount` after a partial refund. */
  amountPaid: number;
  /** `amount - amountPaid` — what's still owed. Zero for `written_off`, since nobody owes that. */
  outstanding: number;
  status: BillStatus;
  dueDate: string;
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
  /** The agreed window the plan must be cleared in. Null on plans created before it existed. */
  startsOn: string | null;
  endsOn: string | null;
  createdAt: string;
}

export interface Booking {
  id: string;
  bookingCode: string; // e.g. BKG-2026-00001
  patientId: string;
  patientName: string;
  serviceId: string;
  serviceName: string;
  branchId: string;
  branchName: string;
  date: string;
  time: string;
  advanceAmount: number;
  status: "confirmed" | "cancelled";
}

export type DailyClosingStatus = "matched" | "over" | "short";

export interface DailyClosingAmendment {
  id: string;
  previousActualTotal: number;
  correctedActualTotal: number;
  reason: string;
  amendedBy: string;
  amendedAt: string;
}

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
  isAmended: boolean;
  amendments: DailyClosingAmendment[];
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

export type AuditLogAction =
  | "create"
  | "update"
  | "soft_delete"
  | "approve"
  | "reject"
  | "void"
  | "refund_request"
  | "refund_approve"
  | "refund_reject"
  | "terminate"
  | "amend"
  | "write_off"
  | "login";

export interface AuditLogEntry {
  id: string;
  actorEmail: string;
  action: AuditLogAction;
  targetType: string;
  targetId: string;
  branchId: string | null;
  branchName: string | null;
  reason: string;
  /**
   * Two shapes, both used deliberately by the backend (apps/common/audit.py):
   * a `{from, to}` pair for a field that moved (an update, an approval), and
   * a bare value for a field simply recorded as-is (what a create wrote).
   */
  changes: Record<string, { from: unknown; to: unknown } | unknown>;
  createdAt: string;
}
