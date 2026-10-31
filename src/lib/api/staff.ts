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

/** One member, from any branch Admin can see — for screens outside the roster that only hold a staff id. */
export async function getStaffMember(id: string): Promise<StaffMember> {
  const { data } = await apiClient.get<RawStaffMember>(`/staff/${id}/`);
  return normalizeMember(data);
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
  photoUrl?: string;
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
/**
 * One day's attendance, keyed by staff id.
 *
 * `date` defaults to today, which is the live sheet: the server runs its
 * auto-close jobs first, so a missing key means "not checked in yet" and the
 * screen offers the button.
 *
 * Any other date is history. The server does not auto-close it (marking
 * someone absent for a day already over would invent a fact nobody observed)
 * and the roster it reads includes staff who have since left — they worked
 * that day. A missing key there means no record exists, so the screen shows
 * nobody rather than an absence.
 */
export async function getTodayAttendance(
  branchId?: string,
  date?: string,
): Promise<Record<string, StaffAttendance>> {
  const { data } = await apiClient.get<Record<string, RawAttendance>>(
    "/staff/today-attendance/",
    { params: { ...branchParams(branchId).params, date } },
  );
  return Object.fromEntries(
    Object.entries(data).map(([staffId, record]) => [staffId, normalizeAttendance(record)]),
  );
}

export async function checkInStaff(
  branchId: string | undefined,
  staffId: string,
): Promise<StaffAttendance> {
  // Status is decided server-side from the actual clock: it feeds payroll,
  // so the browser's clock doesn't get a vote.
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

/** `month` is an ISO "YYYY-MM"; the backend defaults to the current month when omitted. Powers the drawer's attendance calendar. */
export async function listAttendanceHistory(
  branchId: string | undefined,
  staffId: string,
  month?: string,
): Promise<StaffAttendance[]> {
  const { data } = await apiClient.get<RawAttendance[]>(
    `/staff/${staffId}/attendance-history/`,
    { params: { month } },
  );
  return data.map(normalizeAttendance);
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

export interface StaffMonthlyReportRow {
  staffId: string;
  staffCode: string;
  name: string;
  designation: StaffDesignation;
  monthlySalary: number;
  bonusTotal: number;
  netPayable: number;
  presentCount: number;
  earlyLeaveCount: number;
  absentCount: number;
  leaveCount: number;
}

interface RawMonthlyReportRow
  extends Omit<StaffMonthlyReportRow, "monthlySalary" | "bonusTotal" | "netPayable"> {
  monthlySalary: number | string;
  bonusTotal: number | string;
  netPayable: number | string;
}

/** `month` is an ISO "YYYY-MM"; the backend defaults to the current month when omitted. Powers the roster's CSV export. */
export async function getMonthlyReport(
  branchId?: string,
  month?: string,
): Promise<StaffMonthlyReportRow[]> {
  const { data } = await apiClient.get<RawMonthlyReportRow[]>("/staff/monthly-report/", {
    params: { branch: branchId || undefined, month },
  });
  return data.map((row) => ({
    ...row,
    monthlySalary: Number(row.monthlySalary),
    bonusTotal: Number(row.bonusTotal),
    netPayable: Number(row.netPayable),
  }));
}

/** Marks a staff member inactive — they drop out of payroll but keep their history. */
export async function deactivateStaff(id: string): Promise<StaffMember> {
  const { data } = await apiClient.post<RawStaffMember>(`/staff/${id}/deactivate/`);
  return normalizeMember(data);
}

export async function activateStaff(id: string): Promise<StaffMember> {
  const { data } = await apiClient.post<RawStaffMember>(`/staff/${id}/activate/`);
  return normalizeMember(data);
}


/** A decimal string on the wire (COERCE_DECIMAL_TO_STRING), like every other money field. */
type Money = string;

export type StaffAdvanceStatus =
  | "pending_approval"
  | "approved"
  | "rejected"
  | "paid";

export interface StaffAdvance {
  id: string;
  staffId: string;
  staffName: string;
  staffCode: string;
  staffPhotoUrl: string;
  branchId: string;
  branchName: string;
  amount: number;
  reason: string;
  /** How much later salary has already taken back. */
  recoveredAmount: number;
  /** Still to come out of future salary. */
  outstanding: number;
  status: StaffAdvanceStatus;
  requestedBy: string;
  reviewNote: string;
  reviewedBy: string;
  reviewedAt: string | null;
  paymentMethod: string;
  paidAt: string | null;
  expenseId: string | null;
  expenseCode: string;
  createdAt: string;
}

interface RawAdvance
  extends Omit<StaffAdvance, "id" | "amount" | "recoveredAmount" | "outstanding"> {
  id: number | string;
  amount: Money | number;
  recoveredAmount: Money | number;
  outstanding: Money | number;
}

function normalizeAdvance(raw: RawAdvance): StaffAdvance {
  return {
    ...raw,
    id: String(raw.id),
    amount: Number(raw.amount),
    recoveredAmount: Number(raw.recoveredAmount),
    outstanding: Number(raw.outstanding),
  };
}

export async function listStaffAdvances(
  branchId: string | undefined,
  staffId: string,
): Promise<StaffAdvance[]> {
  const { data } = await apiClient.get<RawAdvance[]>(`/staff/${staffId}/advances/`);
  return data.map(normalizeAdvance);
}

export interface RequestAdvanceInput {
  staffId: string;
  amount: number;
  /** Required — see the backend's docs/14. */
  reason: string;
}

/**
 * Ask Admin to approve paying this staff member early.
 *
 * No branch and no requester in the body: the server derives both from the
 * authenticated manager, as it does for every other branch-desk action.
 */
export async function requestStaffAdvance(
  input: RequestAdvanceInput,
): Promise<StaffAdvance> {
  const { data } = await apiClient.post<RawAdvance>(
    `/staff/${input.staffId}/request-advance/`,
    { amount: input.amount, reason: input.reason },
  );
  return normalizeAdvance(data);
}

export interface AdvanceListParams {
  branchId?: string;
  status?: StaffAdvanceStatus;
  staffId?: string;
}

export async function listAdvances(
  params: AdvanceListParams = {},
): Promise<StaffAdvance[]> {
  const { data } = await apiClient.get<RawAdvance[] | { results: RawAdvance[] }>(
    "/staff/advances/",
    {
      params: {
        branch: params.branchId || undefined,
        status: params.status,
        staff: params.staffId,
      },
    },
  );
  const rows = Array.isArray(data) ? data : data.results;
  return rows.map(normalizeAdvance);
}

export async function reviewStaffAdvance(
  advanceId: string,
  approve: boolean,
  reviewNote = "",
): Promise<StaffAdvance> {
  const { data } = await apiClient.post<RawAdvance>(
    `/staff/advances/${advanceId}/review/`,
    { approve, reviewNote },
  );
  return normalizeAdvance(data);
}

export async function disburseStaffAdvance(
  advanceId: string,
  paymentMethod: string,
): Promise<StaffAdvance> {
  const { data } = await apiClient.post<RawAdvance>(
    `/staff/advances/${advanceId}/disburse/`,
    { paymentMethod },
  );
  return normalizeAdvance(data);
}
