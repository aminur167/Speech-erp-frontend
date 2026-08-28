import { listInstallmentPlans } from "@/lib/api/installmentPlans";
import { listMonthlyEnrollments } from "@/lib/api/monthlyEnrollments";

/**
 * Live "N enrolled" counts per service, derived from actual active installment
 * plans and monthly enrollments — not a stored/fabricated field. Daily and
 * online services have no subscription concept, so they're simply absent here.
 */
export async function getServiceEnrollmentCounts(): Promise<Record<string, number>> {
  const [plans, enrollments] = await Promise.all([
    listInstallmentPlans(),
    listMonthlyEnrollments(),
  ]);
  const counts: Record<string, number> = {};
  for (const plan of plans) {
    if (plan.status !== "active") continue;
    counts[plan.serviceId] = (counts[plan.serviceId] ?? 0) + 1;
  }
  for (const enrollment of enrollments) {
    if (enrollment.status !== "active") continue;
    counts[enrollment.serviceId] = (counts[enrollment.serviceId] ?? 0) + 1;
  }
  return counts;
}
