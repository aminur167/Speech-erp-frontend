import { apiClient } from "@/lib/api/client";
import {
  normalizeOutstandingItem,
  type OutstandingDueItem,
} from "@/lib/api/monthlyEnrollments";
import type { MonthlyEnrollment, InstallmentPlan } from "@/types/domain";

/**
 * Every service a patient holds — monthly enrollments and installment plans
 * alike, each with the service name already joined in. The backend assembles
 * this discriminated union in one call (GET /patients/{id}/active-services/);
 * nothing is joined client-side.
 *
 * Inactive services are included and flagged with `isActive`, not filtered
 * out. The profile has to offer Reactivate and show what was kept or
 * cancelled — a service that vanished from this list would be unreachable.
 */

interface ServiceItemBase {
  id: string;
  serviceName: string;
  createdAt: string;
  isActive: boolean;
}

export type PatientActiveServiceItem =
  | (ServiceItemBase & { type: "monthly"; enrollment: MonthlyEnrollment })
  | (ServiceItemBase & { type: "installment"; plan: InstallmentPlan });

interface RawActiveServiceItem {
  type: "monthly" | "installment";
  id: number | string;
  serviceName: string;
  createdAt: string;
  isActive?: boolean;
  enrollment?: MonthlyEnrollment & { id: number | string };
  plan?: InstallmentPlan & { id: number | string };
}

function normalizeItem(raw: RawActiveServiceItem): PatientActiveServiceItem {
  const id = String(raw.id);
  // `isActive` defaults true so an older backend that does not send it still
  // renders every service as running rather than as a wall of Reactivate.
  const isActive = raw.isActive ?? true;
  if (raw.type === "monthly" && raw.enrollment) {
    return {
      type: "monthly",
      id,
      serviceName: raw.serviceName,
      createdAt: raw.createdAt,
      isActive,
      enrollment: { ...raw.enrollment, id: String(raw.enrollment.id) },
    };
  }
  return {
    type: "installment",
    id,
    serviceName: raw.serviceName,
    createdAt: raw.createdAt,
    isActive,
    plan: { ...raw.plan!, id: String(raw.plan!.id) },
  };
}

export async function getPatientActiveServices(
  patientId: string,
): Promise<PatientActiveServiceItem[]> {
  const { data } = await apiClient.get<RawActiveServiceItem[]>(
    `/patients/${patientId}/active-services/`,
  );
  return data.map(normalizeItem);
}


/**
 * Everything the patient still owes, across every service they hold.
 *
 * The screen reads this before offering a new enrollment or a reactivation,
 * so it can name the months and the amount rather than waiting to be refused.
 * The refusal itself lives on the server — this is the explanation, never the
 * enforcement.
 */
export async function getPatientOutstandingDues(
  patientId: string,
): Promise<{ items: OutstandingDueItem[]; total: number }> {
  const { data } = await apiClient.get<Record<string, unknown>>(
    `/patients/${patientId}/outstanding-dues/`,
  );
  return {
    items: ((data.items ?? []) as Record<string, unknown>[]).map(normalizeOutstandingItem),
    total: Number(data.total ?? 0),
  };
}
