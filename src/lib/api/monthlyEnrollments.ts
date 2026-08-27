import type { MonthlyEnrollment, MonthlyBill } from "@/types/domain";

/**
 * Mock implementation — matches the shape/signature this module will have
 * once it calls the real Django/DRF `/enrollments/monthly/` endpoints.
 */

let enrollments: MonthlyEnrollment[] = [];

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function monthAt(offset: number): { month: string; label: string } {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + offset);
  const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const label = date.toLocaleString("en-US", { month: "long", year: "numeric" });
  return { month, label };
}

export interface CreateMonthlyEnrollmentInput {
  patientId: string;
  serviceId: string;
  branchId: string;
  fee: number;
}

export async function createMonthlyEnrollment(
  input: CreateMonthlyEnrollmentInput,
): Promise<MonthlyEnrollment> {
  await delay(null);
  const bills: MonthlyBill[] = [0, 1, 2].map((offset) => {
    const { month, label } = monthAt(offset);
    return { month, label, amount: input.fee, status: offset === 0 ? "due" : "upcoming" };
  });
  const enrollment: MonthlyEnrollment = {
    id: `menr-${Date.now()}`,
    patientId: input.patientId,
    serviceId: input.serviceId,
    branchId: input.branchId,
    bills,
  };
  enrollments = [enrollment, ...enrollments];
  return enrollment;
}

export async function payMonthlyBill(
  enrollmentId: string,
  month: string,
): Promise<MonthlyEnrollment> {
  await delay(null, 250);
  const enrollment = enrollments.find((e) => e.id === enrollmentId);
  if (!enrollment) {
    throw { message: "Enrollment not found.", status: 404 };
  }
  const billIndex = enrollment.bills.findIndex((b) => b.month === month);
  if (billIndex === -1) {
    throw { message: "Bill not found.", status: 404 };
  }
  enrollment.bills[billIndex].status = "paid";
  if (enrollment.bills[billIndex + 1]) {
    enrollment.bills[billIndex + 1].status = "due";
  }
  return { ...enrollment, bills: [...enrollment.bills] };
}
