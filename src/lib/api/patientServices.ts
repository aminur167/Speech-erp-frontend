import { listMonthlyEnrollments } from "@/lib/api/monthlyEnrollments";
import { listInstallmentPlans } from "@/lib/api/installmentPlans";
import { listServices } from "@/lib/api/services";
import type { MonthlyEnrollment, InstallmentPlan } from "@/types/domain";

/**
 * Resolves every active service a patient currently holds — monthly
 * enrollments and installment plans alike, each with the service name
 * already joined in — used by the patient profile's "Active Services"
 * section. A patient can hold more than one of either kind at once (e.g. an
 * ongoing monthly plan alongside a separate installment package).
 */

export type PatientActiveServiceItem =
  | { type: "monthly"; id: string; serviceName: string; createdAt: string; enrollment: MonthlyEnrollment }
  | { type: "installment"; id: string; serviceName: string; createdAt: string; plan: InstallmentPlan };

export async function getPatientActiveServices(
  patientId: string,
): Promise<PatientActiveServiceItem[]> {
  const [enrollments, plans, services] = await Promise.all([
    listMonthlyEnrollments(),
    listInstallmentPlans(),
    listServices(),
  ]);

  const serviceById = new Map(services.map((service) => [service.id, service]));

  const monthlyItems: PatientActiveServiceItem[] = enrollments
    .filter((e) => e.patientId === patientId && e.status !== "terminated")
    .map((enrollment) => ({
      type: "monthly",
      id: enrollment.id,
      serviceName: serviceById.get(enrollment.serviceId)?.name ?? "—",
      createdAt: enrollment.createdAt,
      enrollment,
    }));

  const installmentItems: PatientActiveServiceItem[] = plans
    .filter((p) => p.patientId === patientId && p.status !== "terminated")
    .map((plan) => ({
      type: "installment",
      id: plan.id,
      serviceName: serviceById.get(plan.serviceId)?.name ?? "—",
      createdAt: plan.createdAt,
      plan,
    }));

  return [...monthlyItems, ...installmentItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
