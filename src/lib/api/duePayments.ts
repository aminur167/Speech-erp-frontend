import {
  listMonthlyEnrollments,
  payMonthlyBill,
  terminateMonthlyEnrollment,
} from "@/lib/api/monthlyEnrollments";
import {
  listInstallmentPlans,
  payInstallment,
  terminateInstallmentPlan,
} from "@/lib/api/installmentPlans";
import { listPatients } from "@/lib/api/patients";
import { listServices } from "@/lib/api/services";
import { createPayment, type CreatePaymentInput } from "@/lib/api/payments";
import type { PaginatedResponse } from "@/types/api";
import type { Payment } from "@/types/domain";

/**
 * Aggregates the currently-due monthly bill (if any) and installment (if any)
 * from every enrollment/plan into one unified "due payments" list — mirrors
 * what a real backend would return via a joined/denormalized serializer.
 */

export type DuePaymentType = "monthly" | "installment";

export interface DuePaymentItem {
  key: string;
  type: DuePaymentType;
  patientId: string;
  patientName: string;
  patientCode: string;
  serviceId: string;
  serviceName: string;
  branchId: string;
  label: string;
  amount: number;
  refId: string;
  refKey: string;
  /** Installment-only: this due installment's position and how many remain in the plan. */
  installmentIndex?: number;
  installmentsTotal?: number;
  installmentsRemaining?: number;
}

async function collectDueItems(branchId?: string): Promise<DuePaymentItem[]> {
  const [enrollments, plans, patientsPage, services] = await Promise.all([
    listMonthlyEnrollments(),
    listInstallmentPlans(),
    listPatients({ pageSize: 1000 }),
    listServices(),
  ]);

  const patientById = new Map(patientsPage.results.map((p) => [p.id, p]));
  const serviceById = new Map(services.map((s) => [s.id, s]));

  const items: DuePaymentItem[] = [];

  for (const enrollment of enrollments) {
    if (enrollment.status === "terminated") continue;
    if (branchId && enrollment.branchId !== branchId) continue;
    const due = enrollment.bills.find((bill) => bill.status === "due");
    if (!due) continue;
    const patient = patientById.get(enrollment.patientId);
    const service = serviceById.get(enrollment.serviceId);
    items.push({
      key: `monthly-${enrollment.id}-${due.month}`,
      type: "monthly",
      patientId: enrollment.patientId,
      patientName: patient?.name ?? "Unknown patient",
      patientCode: patient?.patientCode ?? "—",
      serviceId: enrollment.serviceId,
      serviceName: service?.name ?? "Unknown service",
      branchId: enrollment.branchId,
      label: due.label,
      amount: due.amount,
      refId: enrollment.id,
      refKey: due.month,
    });
  }

  for (const plan of plans) {
    if (plan.status === "terminated") continue;
    if (branchId && plan.branchId !== branchId) continue;
    const due = plan.installments.find((installment) => installment.status === "due");
    if (!due) continue;
    const patient = patientById.get(plan.patientId);
    const service = serviceById.get(plan.serviceId);
    items.push({
      key: `installment-${plan.id}-${due.index}`,
      type: "installment",
      patientId: plan.patientId,
      patientName: patient?.name ?? "Unknown patient",
      patientCode: patient?.patientCode ?? "—",
      serviceId: plan.serviceId,
      serviceName: service?.name ?? "Unknown service",
      branchId: plan.branchId,
      label: due.label,
      amount: due.amount,
      refId: plan.id,
      refKey: String(due.index),
      installmentIndex: due.index,
      installmentsTotal: plan.installments.length,
      installmentsRemaining: plan.installments.length - due.index,
    });
  }

  return items;
}

export interface DuePaymentListParams {
  search?: string;
  type?: DuePaymentType;
  branchId?: string;
  page?: number;
  pageSize?: number;
}

export async function listDuePayments(
  params: DuePaymentListParams = {},
): Promise<PaginatedResponse<DuePaymentItem>> {
  const { search = "", type, branchId, page = 1, pageSize = 10 } = params;
  const query = search.trim().toLowerCase();

  const all = await collectDueItems(branchId);
  const filtered = all.filter((item) => {
    if (type && item.type !== type) return false;
    if (!query) return true;
    return (
      item.patientName.toLowerCase().includes(query) ||
      item.patientCode.toLowerCase().includes(query) ||
      item.serviceName.toLowerCase().includes(query)
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

export interface DuePaymentsSummary {
  totalDue: number;
  monthlyDue: number;
  installmentDue: number;
}

/**
 * `date` (an ISO "YYYY-MM-DD" from a date picker) reconstructs what was
 * outstanding as of that day, using each bill/installment's `paidAt`: still
 * counts if it wasn't paid yet, or was only paid after the target date.
 * Defaults to the current outstanding snapshot when omitted.
 */
export async function getDuePaymentsSummary(
  branchId?: string,
  date?: string,
): Promise<DuePaymentsSummary> {
  const targetDate = date ? new Date(date) : new Date();
  // Compare "was this already paid/created" against the END of the target day, not its
  // start — otherwise a payment made earlier the same day would still show as outstanding.
  const targetDateEnd = date ? new Date(date) : new Date();
  targetDateEnd.setHours(23, 59, 59, 999);

  const [enrollments, plans] = await Promise.all([
    listMonthlyEnrollments(),
    listInstallmentPlans(),
  ]);

  let monthlyDue = 0;
  for (const enrollment of enrollments) {
    if (enrollment.status === "terminated") continue;
    if (branchId && enrollment.branchId !== branchId) continue;
    const sortedBills = [...enrollment.bills].sort((a, b) => a.month.localeCompare(b.month));
    const dueBill = sortedBills.find(
      (bill) => !bill.paidAt || new Date(bill.paidAt) > targetDateEnd,
    );
    if (dueBill && new Date(`${dueBill.month}-01`) <= targetDate) {
      monthlyDue += dueBill.amount;
    }
  }

  let installmentDue = 0;
  for (const plan of plans) {
    if (plan.status === "terminated") continue;
    if (branchId && plan.branchId !== branchId) continue;
    if (new Date(plan.createdAt) > targetDateEnd) continue;
    const sortedInstallments = [...plan.installments].sort((a, b) => a.index - b.index);
    const dueInstallment = sortedInstallments.find(
      (installment) => !installment.paidAt || new Date(installment.paidAt) > targetDateEnd,
    );
    if (dueInstallment) {
      installmentDue += dueInstallment.amount;
    }
  }

  return { totalDue: monthlyDue + installmentDue, monthlyDue, installmentDue };
}

export interface CollectDuePaymentInput {
  item: Pick<DuePaymentItem, "type" | "refId" | "refKey" | "patientId">;
  payment: CreatePaymentInput;
}

export async function collectDuePayment(input: CollectDuePaymentInput): Promise<Payment> {
  const createdPayment = await createPayment(input.payment);
  if (input.item.type === "monthly") {
    await payMonthlyBill(input.item.refId, input.item.refKey);
  } else {
    await payInstallment(input.item.refId, Number(input.item.refKey));
  }
  return createdPayment;
}

/** Ends a patient's monthly enrollment or installment plan — it stops generating due bills/installments. */
export async function terminateDuePaymentService(
  item: Pick<DuePaymentItem, "type" | "refId">,
): Promise<void> {
  if (item.type === "monthly") {
    await terminateMonthlyEnrollment(item.refId);
  } else {
    await terminateInstallmentPlan(item.refId);
  }
}
