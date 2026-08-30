import { apiClient } from "@/lib/api/client";
import type { PaginatedResponse } from "@/types/api";
import type { Gender, Patient, PaymentMethod, ServiceCategory } from "@/types/domain";

/**
 * Denormalized "patient directory" — the backend joins patient records with
 * their enrollments/plans/payments server-side (apps/patients/directory.py)
 * and returns exactly this shape in one call; nothing is assembled
 * client-side anymore. `patients.ts` stays the lean CRUD module used
 * elsewhere (registration, enrollment wizards' patient search).
 */

export type PatientCareStatus = "active-care" | "in-progress" | "action-needed";
export type PatientTimeRange = "today" | "week" | "month" | "";

export interface PatientDirectoryItem {
  id: string;
  patientCode: string;
  name: string;
  age: number | null;
  gender?: Gender;
  guardianName?: string;
  guardianRelation?: Patient["guardianRelation"];
  phone: string;
  branchId: string;
  branchName: string;
  therapyType: string;
  /** Label of the patient's most recent payment method (e.g. "Cash", "bKash") — "—" if never paid. */
  paymentType: string;
  status: PatientCareStatus;
  /** Every service category this patient has ever been billed for — powers the service-type filter/column. */
  serviceCategories: ServiceCategory[];
  /** Every payment method this patient has ever paid with — powers the payment-type filter. */
  paymentMethods: PaymentMethod[];
  createdAt: string;
  /** Derived, never stored — "overdue" when any active enrollment/plan has an unpaid bill past its due date (docs/05). */
  serviceStatus: "active" | "overdue";
  overdueAmount: number;
  /** The oldest overdue due date, ISO "YYYY-MM-DD" — null when not overdue. */
  overdueSince: string | null;
}

interface RawDirectoryItem extends Omit<PatientDirectoryItem, "id" | "overdueAmount"> {
  id: number | string;
  overdueAmount: number | string;
}

function normalizeItem(raw: RawDirectoryItem): PatientDirectoryItem {
  return { ...raw, id: String(raw.id), overdueAmount: Number(raw.overdueAmount) };
}

/**
 * Still used by PatientProfileView, which only has a `Patient` (no `age`
 * field) on hand, not a directory row. The backend computes age the same
 * way (docs/02); kept here as a pure client-side utility since it needs no
 * network round trip of its own.
 */
export function calculateAge(dateOfBirth?: string): number | null {
  if (!dateOfBirth) return null;
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

export interface PatientDirectorySummary {
  total: number;
  activeCare: number;
  intake: number;
  actionNeeded: number;
  inProgress: number;
}

/** `date` (an ISO "YYYY-MM-DD" from a date picker) scopes `intake` to that date's month; defaults to today. */
export async function getPatientDirectorySummary(
  branchId?: string,
  date?: string,
): Promise<PatientDirectorySummary> {
  const { data } = await apiClient.get<PatientDirectorySummary>("/patients/directory/summary/", {
    params: { branch: branchId, date },
  });
  return data;
}

export interface PatientDirectoryListParams {
  search?: string;
  status?: PatientCareStatus;
  /** Filters to patients ever paid via this method (cash/bkash/nagad/...). */
  paymentType?: PaymentMethod;
  gender?: Gender;
  /** Filters to patients ever billed under this service category (daily/monthly/installment/online). */
  serviceCategory?: ServiceCategory;
  timeRange?: PatientTimeRange;
  branchId?: string;
  /** Exact calendar date (ISO "YYYY-MM-DD") from a date picker — overrides `timeRange` when set. */
  date?: string;
  page?: number;
  pageSize?: number;
}

export async function listPatientDirectory(
  params: PatientDirectoryListParams = {},
): Promise<PaginatedResponse<PatientDirectoryItem>> {
  const { data } = await apiClient.get<PaginatedResponse<RawDirectoryItem>>(
    "/patients/directory/",
    {
      params: {
        search: params.search,
        status: params.status,
        paymentType: params.paymentType,
        gender: params.gender,
        serviceCategory: params.serviceCategory,
        timeRange: params.timeRange,
        branch: params.branchId,
        date: params.date,
        page: params.page,
        pageSize: params.pageSize,
      },
    },
  );
  return { ...data, results: data.results.map(normalizeItem) };
}
