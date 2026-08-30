import { apiClient } from "@/lib/api/client";
import { toSnakeCase } from "@/lib/api/caseUtils";
import type { PaginatedResponse } from "@/types/api";
import type { Service, ServiceCategory } from "@/types/domain";

// Service, like Branch, has an integer primary key, while every place that
// *refers* to one (Payment.serviceId, MonthlyEnrollment.serviceId, ...) does
// so through an explicit CharField and is already a string. Left as a raw
// number here, `services.find(s => s.id === enrollment.serviceId)` would
// silently never match — the exact bug this once caused for Branch.
interface RawService extends Omit<Service, "id"> {
  id: number | string;
}

function normalizeService(raw: RawService): Service {
  return { ...raw, id: String(raw.id) };
}

export async function listServices(category?: ServiceCategory): Promise<Service[]> {
  const { data } = await apiClient.get<PaginatedResponse<RawService>>("/services/", {
    params: { category, pageSize: 200 },
  });
  return data.results.map(normalizeService);
}

export async function getService(id: string): Promise<Service> {
  const { data } = await apiClient.get<RawService>(`/services/${id}/`);
  return normalizeService(data);
}

export interface ServiceInput {
  name: string;
  code: string;
  category: ServiceCategory;
  fee: number;
  isOnline: boolean;
  description?: string;
  originalFee?: number;
  durationLabel?: string;
  sessionsLabel?: string;
  expiryLabel?: string;
}

export async function createService(input: ServiceInput): Promise<Service> {
  const { data } = await apiClient.post<RawService>("/services/", toSnakeCase(input));
  return normalizeService(data);
}

export async function updateService(id: string, input: ServiceInput): Promise<Service> {
  const { data } = await apiClient.put<RawService>(`/services/${id}/`, toSnakeCase(input));
  return normalizeService(data);
}

export async function deleteService(id: string): Promise<void> {
  await apiClient.delete(`/services/${id}/`);
}
