import { apiClient } from "@/lib/api/client";
import { toSnakeCase } from "@/lib/api/caseUtils";
import type { PaginatedResponse } from "@/types/api";
import type { Service, ServiceCategory } from "@/types/domain";

// Service, like Branch, has an integer primary key, while every place that
// *refers* to one (Payment.serviceId, MonthlyEnrollment.serviceId, ...) does
// so through an explicit CharField and is already a string. Left as a raw
// number here, `services.find(s => s.id === enrollment.serviceId)` would
// silently never match — the exact bug this once caused for Branch.
//
// `fee`/`originalFee` are real DRF DecimalFields, so they cross the wire as
// JSON strings (COERCE_DECIMAL_TO_STRING) -- normalized here too.
interface RawService extends Omit<Service, "id" | "fee" | "originalFee"> {
  id: number | string;
  fee: number | string;
  originalFee?: number | string;
}

function normalizeService(raw: RawService): Service {
  return {
    ...raw,
    id: String(raw.id),
    fee: Number(raw.fee),
    originalFee: raw.originalFee === undefined ? undefined : Number(raw.originalFee),
  };
}

export async function listServices(
  category?: ServiceCategory,
  includeInactive?: boolean,
  /** Also returns pending/rejected proposals: every one of them for Admin, only the caller's own for a Manager. Never set this for an enrollment picker — a pending package must not be selectable. */
  includePending?: boolean,
  /** Admin only — narrows the org-wide catalog to one branch. A Manager is always scoped to their own branch server-side regardless of this. */
  branchId?: string,
): Promise<Service[]> {
  const { data } = await apiClient.get<PaginatedResponse<RawService>>("/services/", {
    params: {
      category,
      pageSize: 200,
      includeInactive: includeInactive || undefined,
      includePending: includePending || undefined,
      branch: branchId || undefined,
    },
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
  /** Required when Admin creates directly (no "own branch" to default to); ignored for a Manager's proposal, which always files under their own branch server-side. */
  branch?: string;
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

/** Retires a package from sale — hides it from the enrollment wizards, but existing enrollments keep billing. */
export async function deactivateService(id: string): Promise<Service> {
  const { data } = await apiClient.post<RawService>(`/services/${id}/deactivate/`);
  return normalizeService(data);
}

export async function activateService(id: string): Promise<Service> {
  const { data } = await apiClient.post<RawService>(`/services/${id}/activate/`);
  return normalizeService(data);
}

export interface ReviewServiceInput {
  id: string;
  approve: boolean;
  reviewNote?: string;
}

/** Admin approves or rejects a Manager's proposed package. */
export async function reviewService(input: ReviewServiceInput): Promise<Service> {
  const { data } = await apiClient.post<RawService>(`/services/${input.id}/review/`, {
    approve: input.approve,
    reviewNote: input.reviewNote,
  });
  return normalizeService(data);
}

/** Admin-only — powers the sidebar's Services badge. */
export async function getPendingPackageCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>("/services/pending-count/");
  return data.count;
}
