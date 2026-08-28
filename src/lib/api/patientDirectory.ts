import { listPatients } from "@/lib/api/patients";
import { listServices } from "@/lib/api/services";
import { listMonthlyEnrollments } from "@/lib/api/monthlyEnrollments";
import { listInstallmentPlans } from "@/lib/api/installmentPlans";
import { listBranches } from "@/lib/api/branches";
import { listPayments } from "@/lib/api/payments";
import { PAYMENT_METHOD_LABELS } from "@/utils/paymentMethod";
import type { PaginatedResponse } from "@/types/api";
import type { Gender, Patient, PaymentMethod, ServiceCategory } from "@/types/domain";

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
  /** Label of the patient's most recent payment method (e.g. "Cash", "bKash") — "—" if never paid. */
  paymentType: string;
  status: PatientCareStatus;
  /** Every service category this patient has ever been billed for — powers the service-type filter/column. */
  serviceCategories: ServiceCategory[];
  /** Every payment method this patient has ever paid with — powers the payment-type filter. */
  paymentMethods: PaymentMethod[];
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
  const [patientsPage, services, monthlyEnrollments, installmentPlans, branches, payments] =
    await Promise.all([
      listPatients({ pageSize: 1000 }),
      listServices(),
      listMonthlyEnrollments(),
      listInstallmentPlans(),
      listBranches(),
      listPayments(),
    ]);

  const serviceById = new Map(services.map((service) => [service.id, service]));
  const branchById = new Map(branches.map((branch) => [branch.id, branch]));

  const categoriesByPatient = new Map<string, Set<ServiceCategory>>();
  for (const payment of payments) {
    if (!payment.category || payment.category === "material_sale") continue;
    const categories = categoriesByPatient.get(payment.patientId) ?? new Set<ServiceCategory>();
    categories.add(payment.category);
    categoriesByPatient.set(payment.patientId, categories);
  }

  const paymentsByPatient = new Map<string, typeof payments>();
  for (const payment of payments) {
    const list = paymentsByPatient.get(payment.patientId) ?? [];
    list.push(payment);
    paymentsByPatient.set(payment.patientId, list);
  }

  return patientsPage.results.map((patient) => {
    const monthlyEnrollment = monthlyEnrollments.find(
      (e) => e.patientId === patient.id && e.status !== "terminated",
    );
    const installmentPlan = installmentPlans.find(
      (p) => p.patientId === patient.id && p.status !== "terminated",
    );

    let therapyType = "—";
    let status: PatientCareStatus = "action-needed";

    if (monthlyEnrollment) {
      therapyType = serviceById.get(monthlyEnrollment.serviceId)?.name ?? "—";
      status = "active-care";
    } else if (installmentPlan) {
      therapyType = serviceById.get(installmentPlan.serviceId)?.name ?? "—";
      status = "in-progress";
    }

    const patientPayments = paymentsByPatient.get(patient.id) ?? [];
    const latestPayment = [...patientPayments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
    const paymentType = latestPayment ? PAYMENT_METHOD_LABELS[latestPayment.method] : "—";
    const paymentMethods = Array.from(new Set(patientPayments.map((p) => p.method)));

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
      serviceCategories: Array.from(categoriesByPatient.get(patient.id) ?? []),
      paymentMethods,
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

/** `date` (an ISO "YYYY-MM-DD" from a date picker) scopes `intake` to that date's month; defaults to today. */
export async function getPatientDirectorySummary(
  branchId?: string,
  date?: string,
): Promise<PatientDirectorySummary> {
  const directory = await buildDirectory();
  const scoped = branchId ? directory.filter((p) => p.branchId === branchId) : directory;

  const target = date ? new Date(date) : new Date();
  const monthKey = `${target.getFullYear()}-${target.getMonth()}`;

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
  const {
    search = "",
    status,
    paymentType,
    gender,
    serviceCategory,
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
    if (paymentType && !patient.paymentMethods.includes(paymentType)) return false;
    if (gender && patient.gender !== gender) return false;
    if (serviceCategory && !patient.serviceCategories.includes(serviceCategory)) return false;
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
