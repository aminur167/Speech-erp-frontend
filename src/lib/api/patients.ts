import { apiClient } from "@/lib/api/client";
import { toSnakeCase } from "@/lib/api/caseUtils";
import type { PaginatedResponse } from "@/types/api";
import type { Patient } from "@/types/domain";

export interface PatientListParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listPatients(
  params: PatientListParams = {},
): Promise<PaginatedResponse<Patient>> {
  const { data } = await apiClient.get<PaginatedResponse<Patient>>("/patients/", {
    params: { search: params.search, page: params.page, pageSize: params.pageSize },
  });
  return data;
}

export async function getPatient(id: string): Promise<Patient> {
  const { data } = await apiClient.get<Patient>(`/patients/${id}/`);
  return data;
}

export interface CreatePatientInput {
  name: string;
  phone: string;
  email?: string;
  gender?: Patient["gender"];
  dateOfBirth?: string;
  guardianName?: string;
  guardianRelation?: Patient["guardianRelation"];
  /** Required when the patient is a minor (docs/02) — the backend enforces this, not the form. */
  guardianPhone?: string;
  address?: string;
}

export async function createPatient(input: CreatePatientInput): Promise<Patient> {
  // No branchId: the backend always assigns the authenticated manager's own
  // branch and ignores anything posted here, the same rule as every other
  // branch-scoped create endpoint.
  const { data } = await apiClient.post<Patient>("/patients/", toSnakeCase(input));
  return data;
}
