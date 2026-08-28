import { listPatients } from "@/lib/api/patients";
import { listServices } from "@/lib/api/services";
import { listMonthlyEnrollments } from "@/lib/api/monthlyEnrollments";
import { listInstallmentPlans } from "@/lib/api/installmentPlans";
import { listBranches } from "@/lib/api/branches";
import type { PaginatedResponse } from "@/types/api";
import type { Gender, Patient } from "@/types/domain";

/**
 * Denormalized "patient directory" view — joins patient records with their
 * enrollments/plans to surface current therapy type, payment type, and care
 * status. Mirrors what a real backend would return via a joined serializer;
 * `patients.ts` stays the lean CRUD module used elsewhere (registration,
 * enrollment wizards' patient search).
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
  paymentType: string;
  status: PatientCareStatus;
  createdAt: string;
}

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

async function buildDirectory(): Promise<PatientDirectoryItem[]> {
  const [patientsPage, services, monthlyEnrollments, installmentPlans, branches] =
    await Promise.all([
      listPatients({ pageSize: 1000 }),
      listServices(),
      listMonthlyEnrollments(),
      listInstallmentPlans(),
      listBranches(),
    ]);

  const serviceById = new Map(services.map((service) => [service.id, service]));
  const branchById = new Map(branches.map((branch) => [branch.id, branch]));

  return patientsPage.results.map((patient) => {
    const monthlyEnrollment = monthlyEnrollments.find(
      (e) => e.patientId === patient.id && e.status !== "terminated",
    );
    const installmentPlan = installmentPlans.find(
      (p) => p.patientId === patient.id && p.status !== "terminated",
    );

    let therapyType = "—";
    let paymentType = "—";
    let status: PatientCareStatus = "action-needed";

    if (monthlyEnrollment) {
      therapyType = serviceById.get(monthlyEnrollment.serviceId)?.name ?? "—";
      paymentType = "Monthly";
      status = "active-care";
    } else if (installmentPlan) {
      therapyType = serviceById.get(installmentPlan.serviceId)?.name ?? "—";
      paymentType = "Installment";
      status = "in-progress";
    }

    return {
      id: patient.id,
      patientCode: patient.patientCode,
      name: patient.name,
      age: calculateAge(patient.dateOfBirth),
      gender: patient.gender,
      guardianName: patient.guardianName,
      guardianRelation: patient.guardianRelation,
      phone: patient.phone,
      branchId: patient.branchId,
      branchName: branchById.get(patient.branchId)?.name ?? patient.branchId,
      therapyType,
      paymentType,
      status,
      createdAt: patient.createdAt,
    };
  });
}

export interface PatientDirectorySummary {
  total: number;
  activeCare: number;
  intake: number;
  actionNeeded: number;
  inProgress: number;
}

export async function getPatientDirectorySummary(
  branchId?: string,
): Promise<PatientDirectorySummary> {
  const directory = await buildDirectory();
  const scoped = branchId ? directory.filter((p) => p.branchId === branchId) : directory;

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${now.getMonth()}`;

  return {
    total: scoped.length,
    activeCare: scoped.filter((p) => p.status === "active-care").length,
    inProgress: scoped.filter((p) => p.status === "in-progress").length,
    actionNeeded: scoped.filter((p) => p.status === "action-needed").length,
    intake: scoped.filter((p) => {
      const created = new Date(p.createdAt);
      return `${created.getFullYear()}-${created.getMonth()}` === monthKey;
    }).length,
  };
}

export interface PatientDirectoryListParams {
  search?: string;
  status?: PatientCareStatus;
  paymentType?: string;
  gender?: Gender;
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
  const {
    search = "",
    status,
    paymentType,
    gender,
    timeRange,
    branchId,
    date,
    page = 1,
    pageSize = 10,
  } = params;
  const query = search.trim().toLowerCase();
  const now = new Date();

  const directory = await buildDirectory();

  const filtered = directory.filter((patient) => {
    if (branchId && patient.branchId !== branchId) return false;
    if (status && patient.status !== status) return false;
    if (paymentType && patient.paymentType !== paymentType) return false;
    if (gender && patient.gender !== gender) return false;
    if (date) {
      if (new Date(patient.createdAt).toDateString() !== new Date(date).toDateString())
        return false;
    } else if (timeRange) {
      const created = new Date(patient.createdAt);
      if (timeRange === "today" && created.toDateString() !== now.toDateString()) return false;
      const days = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      if (timeRange === "week" && days > 7) return false;
      if (timeRange === "month" && days > 30) return false;
    }
    if (!query) return true;
    return (
      patient.name.toLowerCase().includes(query) ||
      patient.patientCode.toLowerCase().includes(query) ||
      patient.phone.includes(query) ||
      (patient.guardianName?.toLowerCase().includes(query) ?? false)
    );
  });

  const start = (page - 1) * pageSize;
  const results = filtered.slice(start, start + pageSize);

  return {
    count: filtered.length,
    next: start + pageSize < filtered.length ? String(page + 1) : null,
    previous: page > 1 ? String(page - 1) : null,
    results,
  };
}
