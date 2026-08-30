import { apiClient } from "@/lib/api/client";
import type { MonthlyEnrollment, InstallmentPlan } from "@/types/domain";

/**
 * Every active service a patient currently holds — monthly enrollments and
 * installment plans alike, each with the service name already joined in.
 * The backend assembles this same discriminated union in one call
 * (GET /patients/{id}/active-services/); nothing is joined client-side
 * anymore.
 */

export type PatientActiveServiceItem =
  | { type: "monthly"; id: string; serviceName: string; createdAt: string; enrollment: MonthlyEnrollment }
  | { type: "installment"; id: string; serviceName: string; createdAt: string; plan: InstallmentPlan };

interface RawActiveServiceItem {
  type: "monthly" | "installment";
  id: number | string;
  serviceName: string;
  createdAt: string;
  enrollment?: MonthlyEnrollment & { id: number | string };
  plan?: InstallmentPlan & { id: number | string };
}

function normalizeItem(raw: RawActiveServiceItem): PatientActiveServiceItem {
  const id = String(raw.id);
  if (raw.type === "monthly" && raw.enrollment) {
    return {
      type: "monthly",
      id,
      serviceName: raw.serviceName,
      createdAt: raw.createdAt,
      enrollment: { ...raw.enrollment, id: String(raw.enrollment.id) },
    };
  }
  return {
    type: "installment",
    id,
    serviceName: raw.serviceName,
    createdAt: raw.createdAt,
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
