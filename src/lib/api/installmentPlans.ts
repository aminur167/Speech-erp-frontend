import type { InstallmentPlan, Installment } from "@/types/domain";

/**
 * Mock implementation — matches the shape/signature this module will have
 * once it calls the real Django/DRF `/enrollments/installments/` endpoints.
 */

const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th", "6th"];

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function buildInstallments(totalAmount: number, numberOfInstallments: number): Installment[] {
  const base = Math.floor(totalAmount / numberOfInstallments);
  const remainder = totalAmount - base * numberOfInstallments;
  return Array.from({ length: numberOfInstallments }, (_, i) => ({
    index: i + 1,
    label: `${ORDINALS[i] ?? `${i + 1}th`} Installment`,
    amount: i === numberOfInstallments - 1 ? base + remainder : base,
    status: i === 0 ? "due" : "upcoming",
  }));
}

let plans: InstallmentPlan[] = [
  {
    id: "plan-seed-1",
    patientId: "p-7",
    serviceId: "s-11",
    branchId: "branch-1",
    totalAmount: 18500,
    installments: buildInstallments(18500, 3),
    status: "active",
  },
];

export async function listInstallmentPlans(): Promise<InstallmentPlan[]> {
  await delay(null, 150);
  return plans;
}

export interface CreateInstallmentPlanInput {
  patientId: string;
  serviceId: string;
  branchId: string;
  totalAmount: number;
  numberOfInstallments: number;
}

export async function createInstallmentPlan(
  input: CreateInstallmentPlanInput,
): Promise<InstallmentPlan> {
  await delay(null);
  const plan: InstallmentPlan = {
    id: `plan-${Date.now()}`,
    patientId: input.patientId,
    serviceId: input.serviceId,
    branchId: input.branchId,
    totalAmount: input.totalAmount,
    installments: buildInstallments(input.totalAmount, input.numberOfInstallments),
    status: "active",
  };
  plans = [plan, ...plans];
  return plan;
}

export async function payInstallment(planId: string, index: number): Promise<InstallmentPlan> {
  await delay(null, 250);
  const plan = plans.find((p) => p.id === planId);
  if (!plan) {
    throw { message: "Installment plan not found.", status: 404 };
  }
  const i = plan.installments.findIndex((x) => x.index === index);
  if (i === -1) {
    throw { message: "Installment not found.", status: 404 };
  }
  plan.installments[i].status = "paid";
  if (plan.installments[i + 1]) {
    plan.installments[i + 1].status = "due";
  }
  return { ...plan, installments: [...plan.installments] };
}

export async function terminateInstallmentPlan(planId: string): Promise<InstallmentPlan> {
  await delay(null, 250);
  const plan = plans.find((p) => p.id === planId);
  if (!plan) {
    throw { message: "Installment plan not found.", status: 404 };
  }
  plan.status = "terminated";
  return { ...plan };
}
