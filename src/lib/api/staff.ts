/**
 * Staff HR — the branch's team, their attendance, and their bonuses.
 *
 * Backed by apps/staff/ on the Django side. Branch scoping follows the usual
 * rule: `branchId` is how Admin says which branch's roster to read, and it is
 * ignored server-side for a Manager, who is always pinned to their own.
 *
 * Money and id fields are normalised on the way in. DRF serialises a
 * DecimalField to a JSON *string* (COERCE_DECIMAL_TO_STRING) and a pk to a
 * number, so a `monthlySalary` typed `number` would otherwise be a string at
 * runtime — the bug that once rendered branch revenue as NaN.
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

interface RawStaffMember extends Omit<StaffMember, "id" | "monthlySalary"> {
  id: number | string;
  monthlySalary: number | string;
}
function normalizeMember(raw: RawStaffMember): StaffMember {
  return { ...raw, id: String(raw.id), monthlySalary: Number(raw.monthlySalary) };
}

interface RawAttendance extends Omit<StaffAttendance, "id" | "staffId"> {
  id: number | string;
  staffId: number | string;
}
function normalizeAttendance(raw: RawAttendance): StaffAttendance {
  return { ...raw, id: String(raw.id), staffId: String(raw.staffId) };
}

interface RawBonus extends Omit<StaffBonus, "id" | "staffId" | "amount"> {
  id: number | string;
  staffId: number | string;
  amount: number | string;
}
function normalizeBonus(raw: RawBonus): StaffBonus {
  return {
    ...raw,
    id: String(raw.id),
    staffId: String(raw.staffId),
    amount: Number(raw.amount),
  };
}

/** Admin narrows with it; a Manager's is ignored server-side. */
function branchParams(branchId?: string) {
  return { params: { branch: branchId || undefined } };
}

export async function listStaff(branchId?: string): Promise<StaffMember[]> {
  // The roster screen shows the whole team at once — every row carries an
  // attendance control the manager works down in one pass — but the endpoint
  // paginates at the project's default page size. So follow `next` rather
  // than quietly showing only the first ten people on the team.
  const collected: RawStaffMember[] = [];
  let page: number | undefined = 1;

  while (page) {
    const { data }: { data: PaginatedResponse<RawStaffMember> } = await apiClient.get(
      "/staff/",
      { params: { branch: branchId || undefined, page } },
    );
    collected.push(...data.results);
    page = data.next ? page + 1 : undefined;
  }

  return collected.map(normalizeMember);
}

export interface StaffSummary {
  totalStaff: number;
  presentToday: number;
  onLeaveToday: number;
  monthlySalaryPayout: number;
  monthlyBonusPayout: number;
}

export async function getStaffSummary(branchId?: string): Promise<StaffSummary> {
  const { data } = await apiClient.get<Record<string, unknown>>(
    "/staff/summary/",
    branchParams(branchId),
  );
  return {
    totalStaff: Number(data.totalStaff ?? 0),
    presentToday: Number(data.presentToday ?? 0),
    onLeaveToday: Number(data.onLeaveToday ?? 0),
    monthlySalaryPayout: Number(data.monthlySalaryPayout ?? 0),
    monthlyBonusPayout: Number(data.monthlyBonusPayout ?? 0),
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

export async function createStaff(
  branchId: string | undefined,
  input: StaffInput,
): Promise<StaffMember> {
  const { data } = await apiClient.post<RawStaffMember>("/staff/", toSnakeCase(input));
  return normalizeMember(data);
}

export async function updateStaff(
  branchId: string | undefined,
  id: string,
  input: Partial<StaffInput>,
): Promise<StaffMember> {
  // PATCH, not PUT: the salary edit in the detail drawer sends one field, and
  // a full replace would blank everything it left out.
  const { data } = await apiClient.patch<RawStaffMember>(`/staff/${id}/`, toSnakeCase(input));
  return normalizeMember(data);
}

/** Soft-delete server-side — attendance and bonus history stay resolvable. */
export async function deleteStaff(branchId: string | undefined, id: string): Promise<void> {
  await apiClient.delete(`/staff/${id}/`);
}

/** Today's attendance keyed by staff id — staff nobody has marked yet are simply missing keys. */
export async function getTodayAttendance(
  branchId?: string,
): Promise<Record<string, StaffAttendance>> {
  const { data } = await apiClient.get<Record<string, RawAttendance>>(
    "/staff/today-attendance/",
    branchParams(branchId),
  );
  return Object.fromEntries(
    Object.entries(data).map(([staffId, record]) => [staffId, normalizeAttendance(record)]),
  );
}

export async function checkInStaff(
  branchId: string | undefined,
  staffId: string,
): Promise<StaffAttendance> {
  // Present-or-late is decided server-side from the check-in time: it feeds
  // payroll, so the browser's clock doesn't get a vote.
  const { data } = await apiClient.post<RawAttendance>(`/staff/${staffId}/check-in/`);
  return normalizeAttendance(data);
}

export async function checkOutStaff(
  branchId: string | undefined,
  staffId: string,
): Promise<StaffAttendance> {
  const { data } = await apiClient.post<RawAttendance>(`/staff/${staffId}/check-out/`);
  return normalizeAttendance(data);
}

export async function markAttendanceStatus(
  branchId: string | undefined,
  staffId: string,
  status: Extract<AttendanceStatus, "on_leave" | "absent">,
): Promise<StaffAttendance> {
  const { data } = await apiClient.post<RawAttendance>(
    `/staff/${staffId}/mark-attendance/`,
    { status },
  );
  return normalizeAttendance(data);
}

export async function listAttendanceHistory(
  branchId: string | undefined,
  staffId: string,
  days = 14,
): Promise<StaffAttendance[]> {
  // The endpoint returns the last month, newest first; the drawer shows a
  // fortnight of it.
  const { data } = await apiClient.get<RawAttendance[]>(
    `/staff/${staffId}/attendance-history/`,
  );
  return data.slice(0, days).map(normalizeAttendance);
}

export interface BonusInput {
  staffId: string;
  amount: number;
  reason: string;
}

/** Who awarded it is taken from the authenticated user — a client can't name someone else. */
export async function addBonus(
  branchId: string | undefined,
  input: BonusInput,
): Promise<StaffBonus> {
  const { data } = await apiClient.post<RawBonus>(`/staff/${input.staffId}/award-bonus/`, {
    amount: input.amount,
    reason: input.reason,
  });
  return normalizeBonus(data);
}

export async function listBonuses(
  branchId: string | undefined,
  staffId: string,
): Promise<StaffBonus[]> {
  const { data } = await apiClient.get<RawBonus[]>(`/staff/${staffId}/bonuses/`);
  return data.map(normalizeBonus);
}
