import { apiClient } from "@/lib/api/client";
import { toSnakeCase } from "@/lib/api/caseUtils";
import type { PaginatedResponse } from "@/types/api";
import type { Patient } from "@/types/domain";

interface RawPatient extends Omit<Patient, "overdueAmount"> {
  overdueAmount: string;
}

function normalizePatient(raw: RawPatient): Patient {
  return { ...raw, overdueAmount: Number(raw.overdueAmount) };
}

export interface PatientListParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listPatients(
  params: PatientListParams = {},
): Promise<PaginatedResponse<Patient>> {
  const { data } = await apiClient.get<PaginatedResponse<RawPatient>>("/patients/", {
    params: { search: params.search, page: params.page, pageSize: params.pageSize },
  });
  return { ...data, results: data.results.map(normalizePatient) };
}

export async function getPatient(id: string): Promise<Patient> {
  const { data } = await apiClient.get<RawPatient>(`/patients/${id}/`);
  return normalizePatient(data);
}

export interface CreatePatientInput {
  name: string;
  phone: string;
  email?: string;
  gender?: Patient["gender"];
  bloodGroup?: Patient["bloodGroup"];
  dateOfBirth?: string;
  guardianName?: string;
  guardianRelation?: Patient["guardianRelation"];
  /** Required when the patient is a minor (docs/02) — the backend enforces this, not the form. */
  guardianPhone?: string;
  emergencyContact?: string;
  address?: string;
  referredBy?: string;
  chiefComplaint?: string;
  nationalId?: string;
  notes?: string;
}

export async function createPatient(input: CreatePatientInput): Promise<Patient> {
  // No branchId: the backend always assigns the authenticated manager's own
  // branch and ignores anything posted here, the same rule as every other
  // branch-scoped create endpoint.
  const { data } = await apiClient.post<RawPatient>("/patients/", toSnakeCase(input));
  return normalizePatient(data);
}

export type UpdatePatientInput = Partial<CreatePatientInput> & { status?: Patient["status"] };

export async function updatePatient(id: string, input: UpdatePatientInput): Promise<Patient> {
  const { data } = await apiClient.patch<RawPatient>(`/patients/${id}/`, toSnakeCase(input));
  return normalizePatient(data);
}
