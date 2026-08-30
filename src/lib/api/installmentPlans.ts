import { apiClient } from "@/lib/api/client";
import { normalizePayment, type RawPayment } from "@/lib/api/payments";
import type { PaginatedResponse } from "@/types/api";
import type { InstallmentPlan, Installment, Payment } from "@/types/domain";

// `amount`/`amountPaid`/`outstanding`/`totalAmount` are real DRF DecimalFields,
// so they cross the wire as JSON strings (COERCE_DECIMAL_TO_STRING) --
// normalized to numbers here, same as the id fields.
interface RawInstallment extends Omit<Installment, "id" | "amount" | "amountPaid" | "outstanding"> {
  id: number | string;
  amount: number | string;
  amountPaid: number | string;
  outstanding: number | string;
}
interface RawPlan extends Omit<InstallmentPlan, "id" | "installments" | "totalAmount"> {
  id: number | string;
  totalAmount: number | string;
  installments: RawInstallment[];
}

function normalizeInstallment(installment: RawInstallment): Installment {
  return {
    ...installment,
    id: String(installment.id),
    amount: Number(installment.amount),
    amountPaid: Number(installment.amountPaid),
    outstanding: Number(installment.outstanding),
  };
}

function normalizePlan(raw: RawPlan): InstallmentPlan {
  return {
    ...raw,
    id: String(raw.id),
    totalAmount: Number(raw.totalAmount),
    installments: raw.installments.map(normalizeInstallment),
  };
}

export async function listInstallmentPlans(): Promise<InstallmentPlan[]> {
  const { data } = await apiClient.get<PaginatedResponse<RawPlan>>(
    "/enrollments/installments/",
    { params: { pageSize: 500 } },
  );
  return data.results.map(normalizePlan);
}

export interface CreateInstallmentPlanInput {
  patientId: string;
  serviceId: string;
  numberOfInstallments: number;
}

export async function createInstallmentPlan(
  input: CreateInstallmentPlanInput,
): Promise<InstallmentPlan> {
  // No branchId/totalAmount: the backend derives the branch from the
  // authenticated manager and the total from the service's own price.
  const { data } = await apiClient.post<RawPlan>("/enrollments/installments/", {
    patient: input.patientId,
    service: input.serviceId,
    numberOfInstallments: input.numberOfInstallments,
  });
  return normalizePlan(data);
}

export interface PayInstallmentResult {
  payment: Payment;
  plan: InstallmentPlan;
}

/** One atomic call — charges the payment and marks the installment paid together. */
export async function payInstallment(
  planId: string,
  installmentId: string,
  method: string,
  idempotencyKey?: string,
): Promise<PayInstallmentResult> {
  const { data } = await apiClient.post<{ payment: RawPayment; plan: RawPlan }>(
    `/enrollments/installments/${planId}/installments/${installmentId}/pay/`,
    { method, idempotencyKey },
  );
  return {
    payment: normalizePayment(data.payment),
    plan: normalizePlan(data.plan),
  };
}

export async function terminateInstallmentPlan(planId: string): Promise<InstallmentPlan> {
  const { data } = await apiClient.post<RawPlan>(
    `/enrollments/installments/${planId}/terminate/`,
  );
  return normalizePlan(data);
}
