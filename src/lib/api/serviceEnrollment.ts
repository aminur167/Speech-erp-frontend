import { apiClient } from "@/lib/api/client";

/**
 * Live "N enrolled" counts per service. The backend computes this directly
 * from active installment plans and monthly enrollments in one aggregate
 * query (GET /services/enrollment-counts/) — fetching both full lists here
 * and reducing them client-side, as this used to, would mean an extra
 * waterfall for a number the API already provides.
 */
export async function getServiceEnrollmentCounts(): Promise<Record<string, number>> {
  const { data } = await apiClient.get<Record<string, number>>("/services/enrollment-counts/");
  return data;
}
