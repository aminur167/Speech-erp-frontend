/**
 * Staff HR: roster, attendance, salary, and bonuses — backed by apps/staff on
 * the Django backend (branch-scoped and real-time, same as materials/expenses).
 */
import { apiClient } from "@/lib/api/client";
import { toSnakeCase } from "@/lib/api/caseUtils";
import type { PaginatedResponse } from "@/types/api";
import type {
  AttendanceStatus,
  StaffAttendance,
  StaffBonus,
  StaffDesignation,
  StaffMember,
  StaffStatus,
} from "@/types/domain";

// `monthlySalary` is a real DRF DecimalField, so it crosses the wire as a
// JSON string (COERCE_DECIMAL_TO_STRING) — normalized here too, same as id.
interface RawStaffMember extends Omit<StaffMember, "id" | "monthlySalary"> {
  id: number | string;
  monthlySalary: number | string;
}
function normalizeStaffMember(raw: RawStaffMember): StaffMember {
  return { ...raw, id: String(raw.id), monthlySalary: Number(raw.monthlySalary) };
}

interface RawAttendance extends Omit<StaffAttendance, "id"> {
  id: number | string;
}
function normalizeAttendance(raw: RawAttendance): StaffAttendance {
  return { ...raw, id: String(raw.id) };
}

interface RawBonus extends Omit<StaffBonus, "id" | "amount"> {
  id: number | string;
  amount: number | string;
}
function normalizeBonus(raw: RawBonus): StaffBonus {
  return { ...raw, id: String(raw.id), amount: Number(raw.amount) };
}

export async function listStaff(branchId?: string): Promise<StaffMember[]> {
  const { data } = await apiClient.get<PaginatedResponse<RawStaffMember>>("/staff/", {
    params: { branch: branchId, pageSize: 500 },
  });
  return data.results.map(normalizeStaffMember);
}

export interface StaffSummary {
  totalStaff: number;
  presentToday: number;
  onLeaveToday: number;
  monthlySalaryPayout: number;
  monthlyBonusPayout: number;
}

interface RawStaffSummary
  extends Omit<StaffSummary, "monthlySalaryPayout" | "monthlyBonusPayout"> {
  monthlySalaryPayout: number | string;
  monthlyBonusPayout: number | string;
}

export async function getStaffSummary(branchId?: string): Promise<StaffSummary> {
  const { data } = await apiClient.get<RawStaffSummary>("/staff/summary/", {
    params: { branch: branchId },
  });
  return {
    ...data,
    monthlySalaryPayout: Number(data.monthlySalaryPayout),
    monthlyBonusPayout: Number(data.monthlyBonusPayout),
  };
}

export interface StaffInput {
  name: string;
  designation: StaffDesignation;
  phone: string;
  email?: string;
  joinedAt: string;
  monthlySalary: number;
  status: StaffStatus;
}

export async function createStaff(input: StaffInput): Promise<StaffMember> {
  const { data } = await apiClient.post<RawStaffMember>("/staff/", toSnakeCase(input));
  return normalizeStaffMember(data);
}

export async function updateStaff(id: string, input: StaffInput): Promise<StaffMember> {
  const { data } = await apiClient.put<RawStaffMember>(`/staff/${id}/`, toSnakeCase(input));
  return normalizeStaffMember(data);
}

export async function deleteStaff(id: string): Promise<void> {
  await apiClient.delete(`/staff/${id}/`);
}

export async function getTodayAttendance(
  branchId?: string,
): Promise<Record<string, StaffAttendance>> {
  const { data } = await apiClient.get<Record<string, RawAttendance>>(
    "/staff/today-attendance/",
    { params: { branch: branchId } },
  );
  return Object.fromEntries(
    Object.entries(data).map(([staffId, record]) => [staffId, normalizeAttendance(record)]),
  );
}

export async function checkInStaff(staffId: string): Promise<StaffAttendance> {
  const { data } = await apiClient.post<RawAttendance>(`/staff/${staffId}/check-in/`);
  return normalizeAttendance(data);
}

export async function checkOutStaff(staffId: string): Promise<StaffAttendance> {
  const { data } = await apiClient.post<RawAttendance>(`/staff/${staffId}/check-out/`);
  return normalizeAttendance(data);
}

export async function markAttendanceStatus(
  staffId: string,
  status: Extract<AttendanceStatus, "on_leave" | "absent">,
): Promise<StaffAttendance> {
  const { data } = await apiClient.post<RawAttendance>(`/staff/${staffId}/mark-attendance/`, {
    status,
  });
  return normalizeAttendance(data);
}

export async function listAttendanceHistory(staffId: string): Promise<StaffAttendance[]> {
  const { data } = await apiClient.get<RawAttendance[]>(`/staff/${staffId}/attendance-history/`);
  return data.map(normalizeAttendance);
}

export interface BonusInput {
  staffId: string;
  amount: number;
  reason: string;
}

export async function addBonus(input: BonusInput): Promise<StaffBonus> {
  // Who awarded it is derived server-side from the authenticated manager,
  // never from the request body — see apps/staff/services.py::add_bonus.
  const { data } = await apiClient.post<RawBonus>(`/staff/${input.staffId}/award-bonus/`, {
    amount: input.amount,
    reason: input.reason,
  });
  return normalizeBonus(data);
}

export async function listBonuses(staffId: string): Promise<StaffBonus[]> {
  const { data } = await apiClient.get<RawBonus[]>(`/staff/${staffId}/bonuses/`);
  return data.map(normalizeBonus);
}

export interface StaffMonthlyReportRow {
  staffId: string;
  staffCode: string;
  name: string;
  designation: StaffDesignation;
  monthlySalary: number;
  bonusTotal: number;
  netPayable: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  leaveCount: number;
}

interface RawMonthlyReportRow
  extends Omit<StaffMonthlyReportRow, "monthlySalary" | "bonusTotal" | "netPayable"> {
  monthlySalary: number | string;
  bonusTotal: number | string;
  netPayable: number | string;
}

/** `month` is an ISO "YYYY-MM"; defaults to the current month on the backend when omitted. */
export async function getMonthlyReport(
  branchId?: string,
  month?: string,
): Promise<StaffMonthlyReportRow[]> {
  const { data } = await apiClient.get<RawMonthlyReportRow[]>("/staff/monthly-report/", {
    params: { branch: branchId, month },
  });
  return data.map((row) => ({
    ...row,
    monthlySalary: Number(row.monthlySalary),
    bonusTotal: Number(row.bonusTotal),
    netPayable: Number(row.netPayable),
  }));
}
