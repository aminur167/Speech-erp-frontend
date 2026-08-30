import { apiClient } from "@/lib/api/client";
import type { PaginatedResponse } from "@/types/api";
import type { InstallmentPlan, Installment, Payment } from "@/types/domain";

interface RawInstallment extends Omit<Installment, "id"> {
  id: number | string;
}
interface RawPlan extends Omit<InstallmentPlan, "id" | "installments"> {
  id: number | string;
  installments: RawInstallment[];
}

function normalizePlan(raw: RawPlan): InstallmentPlan {
  return {
    ...raw,
    id: String(raw.id),
    installments: raw.installments.map((i) => ({ ...i, id: String(i.id) })),
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
  const { data } = await apiClient.post<{ payment: Payment & { id: number | string }; plan: RawPlan }>(
    `/enrollments/installments/${planId}/installments/${installmentId}/pay/`,
    { method, idempotencyKey },
  );
  return {
    payment: { ...data.payment, id: String(data.payment.id) },
    plan: normalizePlan(data.plan),
  };
}

export async function terminateInstallmentPlan(planId: string): Promise<InstallmentPlan> {
  const { data } = await apiClient.post<RawPlan>(
    `/enrollments/installments/${planId}/terminate/`,
  );
  return normalizePlan(data);
}
