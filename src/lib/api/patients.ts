import type { Patient } from "@/types/domain";
import type { PaginatedResponse } from "@/types/api";

/**
 * Mock implementation — matches the exact shape/signature this module will have
 * once it calls the real Django/DRF `/patients/` endpoints. Swap the body of
 * each function for a real `apiClient` call later; callers never change.
 */

let mockPatients: Patient[] = [
  { id: "p-1", patientCode: "PT-2026-00001", name: "Rafiul Islam", phone: "01711000001", guardianName: "Kamal Islam", guardianRelation: "father", gender: "male", dateOfBirth: "2016-04-12", address: "Dhanmondi, Dhaka", branchId: "branch-1", createdAt: "2026-06-12T09:00:00Z" },
  { id: "p-2", patientCode: "PT-2026-00002", name: "Tasnia Rahman", phone: "01711000002", guardianName: "Nasrin Rahman", guardianRelation: "mother", gender: "female", dateOfBirth: "2018-09-03", address: "Mirpur, Dhaka", branchId: "branch-1", createdAt: "2026-07-03T09:00:00Z" },
  { id: "p-3", patientCode: "PT-2026-00003", name: "Arif Hossain", phone: "01711000003", gender: "male", dateOfBirth: "1995-01-20", address: "Uttara, Dhaka", branchId: "branch-1", createdAt: "2026-05-15T09:00:00Z" },
  { id: "p-4", patientCode: "PT-2026-00004", name: "Nusrat Jahan", phone: "01711000004", guardianName: "Selim Jahan", guardianRelation: "father", gender: "female", dateOfBirth: "2015-11-11", address: "Banani, Dhaka", branchId: "branch-1", createdAt: "2026-08-01T09:00:00Z" },
  { id: "p-5", patientCode: "PT-2026-00005", name: "Fahim Ahmed", phone: "01711000005", gender: "male", dateOfBirth: "2020-02-17", address: "Gulshan, Dhaka", branchId: "branch-1", createdAt: "2026-06-02T09:00:00Z" },
  { id: "p-6", patientCode: "PT-2026-00006", name: "Mim Akter", phone: "01711000006", guardianName: "Rina Akter", guardianRelation: "mother", gender: "female", dateOfBirth: "2017-06-25", address: "Mohammadpur, Dhaka", branchId: "branch-1", createdAt: "2026-07-19T09:00:00Z" },
  { id: "p-7", patientCode: "PT-2026-00007", name: "Shakil Rana", phone: "01711000007", gender: "male", dateOfBirth: "2012-08-08", address: "Badda, Dhaka", branchId: "branch-1", createdAt: "2026-08-05T09:00:00Z" },
  { id: "p-8", patientCode: "PT-2026-00008", name: "Ayesha Siddika", phone: "01711000008", guardianName: "Habib Siddik", guardianRelation: "father", gender: "female", dateOfBirth: "2019-03-30", address: "Rampura, Dhaka", branchId: "branch-1", createdAt: "2026-04-22T09:00:00Z" },
  { id: "p-9", patientCode: "PT-2026-00009", name: "Tanvir Alam", phone: "01711000009", gender: "male", dateOfBirth: "2021-12-01", address: "Malibagh, Dhaka", branchId: "branch-1", createdAt: "2026-08-25T09:00:00Z" },
  { id: "p-10", patientCode: "PT-2026-00010", name: "Sadia Islam", phone: "01711000010", guardianName: "Jashim Islam", guardianRelation: "father", gender: "female", dateOfBirth: "2014-05-19", address: "Khilgaon, Dhaka", branchId: "branch-1", createdAt: "2026-03-11T09:00:00Z" },
  { id: "p-11", patientCode: "PT-2026-00011", name: "Rakib Hasan", phone: "01711000011", gender: "male", dateOfBirth: "2016-10-14", address: "Farmgate, Dhaka", branchId: "branch-1", createdAt: "2026-07-02T09:00:00Z" },
  { id: "p-12", patientCode: "PT-2026-00012", name: "Nabila Chowdhury", phone: "01711000012", guardianName: "Yasin Chowdhury", guardianRelation: "father", gender: "female", dateOfBirth: "2013-07-07", address: "Jatrabari, Dhaka", branchId: "branch-1", createdAt: "2026-08-15T09:00:00Z" },
];

let sequence = mockPatients.length;

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function generatePatientCode(): string {
  sequence += 1;
  const year = new Date().getFullYear();
  return `PT-${year}-${String(sequence).padStart(5, "0")}`;
}

export interface PatientListParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listPatients(
  params: PatientListParams = {},
): Promise<PaginatedResponse<Patient>> {
  const { search = "", page = 1, pageSize = 10 } = params;
  const query = search.trim().toLowerCase();

  const filtered = mockPatients.filter((patient) => {
    if (!query) return true;
    return (
      patient.name.toLowerCase().includes(query) ||
      patient.phone.includes(query) ||
      patient.patientCode.toLowerCase().includes(query) ||
      (patient.guardianName?.toLowerCase().includes(query) ?? false)
    );
  });

  const start = (page - 1) * pageSize;
  const results = filtered.slice(start, start + pageSize);

  await delay(null);

  return {
    count: filtered.length,
    next: start + pageSize < filtered.length ? String(page + 1) : null,
    previous: page > 1 ? String(page - 1) : null,
    results,
  };
}

export async function getPatient(id: string): Promise<Patient> {
  await delay(null, 250);
  const patient = mockPatients.find((p) => p.id === id);
  if (!patient) {
    throw { message: "Patient not found.", status: 404 };
  }
  return patient;
}

export interface CreatePatientInput {
  name: string;
  phone: string;
  email?: string;
  gender?: Patient["gender"];
  dateOfBirth?: string;
  guardianName?: string;
  guardianRelation?: Patient["guardianRelation"];
  address?: string;
  branchId: string;
}

export async function createPatient(input: CreatePatientInput): Promise<Patient> {
  await delay(null);
  const newPatient: Patient = {
    id: `p-${Date.now()}`,
    patientCode: generatePatientCode(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  mockPatients = [newPatient, ...mockPatients];
  return newPatient;
}
