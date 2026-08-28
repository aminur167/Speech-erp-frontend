import { listMonthlyEnrollments } from "@/lib/api/monthlyEnrollments";
import { listInstallmentPlans } from "@/lib/api/installmentPlans";
import { listServices } from "@/lib/api/services";
import type { MonthlyEnrollment, InstallmentPlan } from "@/types/domain";

/**
 * Resolves a single patient's active monthly enrollment and/or installment
 * plan, with the service name already joined in — used by the patient
 * profile's "Active Services" section.
 */

export interface PatientMonthlyEnrollment {
  enrollment: MonthlyEnrollment;
  serviceName: string;
}

export interface PatientInstallmentPlan {
  plan: InstallmentPlan;
  serviceName: string;
}

export interface PatientActiveServices {
  monthly?: PatientMonthlyEnrollment;
  installment?: PatientInstallmentPlan;
}

export async function getPatientActiveServices(
  patientId: string,
): Promise<PatientActiveServices> {
  const [enrollments, plans, services] = await Promise.all([
    listMonthlyEnrollments(),
    listInstallmentPlans(),
    listServices(),
  ]);

  const serviceById = new Map(services.map((service) => [service.id, service]));

  const enrollment = enrollments.find(
    (e) => e.patientId === patientId && e.status !== "terminated",
  );
  const plan = plans.find((p) => p.patientId === patientId && p.status !== "terminated");

  return {
    monthly: enrollment
      ? { enrollment, serviceName: serviceById.get(enrollment.serviceId)?.name ?? "—" }
      : undefined,
    installment: plan
      ? { plan, serviceName: serviceById.get(plan.serviceId)?.name ?? "—" }
      : undefined,
  };
}
