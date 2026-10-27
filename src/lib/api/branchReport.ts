import { apiClient } from "@/lib/api/client";

/** A money figure as the server sends it — a decimal string, never a float. */
type Money = string;

export interface BranchReportPayment {
  receiptNumber: string;
  patientName: string;
  patientCode: string;
  category: string;
  method: string;
  status: string;
  amount: Money;
  collectedBy: string;
  createdAt: string;
}

/**
 * Everything one branch did between two dates, in one response.
 *
 * Fetched in a single call on purpose (see the endpoint's own docstring):
 * nine separate requests would each see a different moment, and a payment
 * taken between the first and the last would land in the total but not in
 * the list.
 */
export interface BranchReport {
  dateFrom: string;
  dateTo: string;
  grossCollected: Money;
  refunded: Money;
  expenses: Money;
  netRevenue: Money;
  outstandingDue: Money;
  paymentCount: number;
  patientsSeen: number;
  newPatients: number;
  byMethod: { method: string; amount: Money }[];
  byCategory: { category: string; amount: Money }[];
  expensesByCategory: { category: string; amount: Money; count: number }[];
  expensesApproved: Money;
  expensesPending: Money;
  /** What each package earned, and how many signed up for it. The server
   *  adds a row for money that belongs to no package (daily visits, counter
   *  sales) so these amounts still total `grossCollected`. */
  byService: { service: string; enrolled: number; amount: Money }[];
  /** Per service kind, never summed: the two are different rosters. Both
   *  keys are always present, even on a day nobody was marked. */
  attendance: Record<"monthly" | "installment", { present: number; informed: number; absent: number }>;
  newlyRegistered: {
    code: string;
    name: string;
    age: number | null;
    gender: string;
    phone: string;
    /** The package they were registered for; empty if they are not on one yet. */
    service: string;
    createdAt: string;
  }[];
  services: {
    newMonthly: number;
    newInstallmentPlans: number;
    bookings: number;
    bookingsCancelled: number;
  };
  materialsSold: { name: string; quantity: number; amount: Money }[];
  staffAttendance: {
    present: number;
    early_leave: number;
    on_leave: number;
    absent: number;
  };
  enquiries: { total: number; converted: number; bySource: { source: string; count: number }[] };
  payments: BranchReportPayment[];
}

export interface BranchReportParams {
  dateFrom: string;
  dateTo: string;
  /** Admin only; a Manager is always scoped to their own branch by the server. */
  branchId?: string;
}

export async function getBranchReport(params: BranchReportParams): Promise<BranchReport> {
  const { data } = await apiClient.get<BranchReport>("/transactions/branch-report/", {
    params: {
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      branch: params.branchId || undefined,
    },
  });
  return data;
}
