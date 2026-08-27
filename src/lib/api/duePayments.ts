import { listMonthlyEnrollments, payMonthlyBill } from "@/lib/api/monthlyEnrollments";
import { listInstallmentPlans, payInstallment } from "@/lib/api/installmentPlans";
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

export async function getDuePaymentsSummary(branchId?: string): Promise<DuePaymentsSummary> {
  const all = await collectDueItems(branchId);
  const monthlyDue = all
    .filter((item) => item.type === "monthly")
    .reduce((sum, item) => sum + item.amount, 0);
  const installmentDue = all
    .filter((item) => item.type === "installment")
    .reduce((sum, item) => sum + item.amount, 0);
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
