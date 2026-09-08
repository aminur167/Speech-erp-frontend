/**
 * Staff HR module — attendance, salary, and bonuses for a branch's team.
 *
 * There is no backend app for this yet (see apps/ in the Django project),
 * so this is a self-contained in-memory mock, same shape any real endpoint
 * would return. Swapping it for `apiClient` calls later is a matter of
 * rewriting the function bodies below — the hooks and components that
 * consume this module don't need to change.
 */
import { generateIdempotencyKey } from "@/lib/offline/idempotency";
import type { AttendanceStatus, StaffAttendance, StaffBonus, StaffDesignation, StaffMember, StaffStatus } from "@/types/domain";

const NETWORK_DELAY_MS = 220;
function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), NETWORK_DELAY_MS));
}

/** Check-ins after this hour are marked "late" rather than "present". */
const LATE_AFTER_HOUR = 10;

function toLocalDateString(value: Date): string {
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${value.getFullYear()}-${month}-${day}`;
}

const staffByBranch = new Map<string, StaffMember[]>();
const attendanceByBranch = new Map<string, StaffAttendance[]>();
const bonusByBranch = new Map<string, StaffBonus[]>();

const SEED_ROSTER: Array<{
  name: string;
  designation: StaffDesignation;
  monthlySalary: number;
  joinedDaysAgo: number;
}> = [
  { name: "Farhana Akter", designation: "therapist", monthlySalary: 42000, joinedDaysAgo: 620 },
  { name: "Tanvir Hasan", designation: "therapist", monthlySalary: 38000, joinedDaysAgo: 410 },
  { name: "Sadia Islam", designation: "receptionist", monthlySalary: 22000, joinedDaysAgo: 300 },
  { name: "Rakibul Karim", designation: "accountant", monthlySalary: 30000, joinedDaysAgo: 540 },
  { name: "Nusrat Jahan", designation: "support_staff", monthlySalary: 18000, joinedDaysAgo: 180 },
  { name: "Delwar Hossain", designation: "cleaner", monthlySalary: 14000, joinedDaysAgo: 90 },
];

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function shortCode(branchId: string): string {
  return branchId.slice(-4).toUpperCase().padStart(4, "0");
}

/** First touch for a branch seeds a believable roster + a couple of weeks of attendance/bonus history, so the screen never opens empty. */
function ensureSeeded(branchId: string) {
  if (staffByBranch.has(branchId)) return;

  const staff: StaffMember[] = SEED_ROSTER.map((seed, index) => ({
    id: `${branchId}-staff-${index + 1}`,
    staffCode: `STF-${shortCode(branchId)}-${String(index + 1).padStart(3, "0")}`,
    name: seed.name,
    designation: seed.designation,
    phone: `01${7 + (index % 3)}${String(10000000 + index * 137).slice(0, 8)}`,
    email: `${seed.name.toLowerCase().replace(/\s+/g, ".")}@speechlab.test`,
    branchId,
    joinedAt: toLocalDateString(daysAgo(seed.joinedDaysAgo)),
    monthlySalary: seed.monthlySalary,
    status: "active",
    createdAt: daysAgo(seed.joinedDaysAgo).toISOString(),
  }));
  staffByBranch.set(branchId, staff);

  const attendance: StaffAttendance[] = [];
  for (let dayOffset = 13; dayOffset >= 1; dayOffset -= 1) {
    const date = toLocalDateString(daysAgo(dayOffset));
    staff.forEach((member, index) => {
      // A light, plausible pattern: mostly present, the occasional late/leave/absence.
      const roll = (dayOffset + index) % 9;
      let status: AttendanceStatus = "present";
      if (roll === 0) status = "late";
      else if (roll === 1) status = "on_leave";
      else if (roll === 2) status = "absent";

      const checkInHour = status === "late" ? 10 + (index % 2) : 9;
      attendance.push({
        id: `${member.id}-att-${date}`,
        staffId: member.id,
        branchId,
        date,
        checkInAt:
          status === "on_leave" || status === "absent"
            ? null
            : `${date}T${String(checkInHour).padStart(2, "0")}:${String((index * 7) % 60).padStart(2, "0")}:00`,
        checkOutAt:
          status === "on_leave" || status === "absent"
            ? null
            : `${date}T${17 + (index % 2)}:${String((index * 11) % 60).padStart(2, "0")}:00`,
        status,
      });
    });
  }
  attendanceByBranch.set(branchId, attendance);

  const bonuses: StaffBonus[] = [
    {
      id: `${branchId}-bonus-1`,
      staffId: staff[0].id,
      branchId,
      amount: 3000,
      reason: "Outstanding patient feedback this quarter",
      awardedBy: "Branch Manager",
      awardedAt: daysAgo(20).toISOString(),
    },
    {
      id: `${branchId}-bonus-2`,
      staffId: staff[2].id,
      branchId,
      amount: 1500,
      reason: "Eid bonus",
      awardedBy: "Branch Manager",
      awardedAt: daysAgo(45).toISOString(),
    },
  ];
  bonusByBranch.set(branchId, bonuses);
}

export async function listStaff(branchId: string): Promise<StaffMember[]> {
  ensureSeeded(branchId);
  const staff = [...(staffByBranch.get(branchId) ?? [])];
  return delay(staff.sort((a, b) => a.name.localeCompare(b.name)));
}

export interface StaffSummary {
  totalStaff: number;
  presentToday: number;
  onLeaveToday: number;
  monthlySalaryPayout: number;
  monthlyBonusPayout: number;
}

export async function getStaffSummary(branchId: string): Promise<StaffSummary> {
  ensureSeeded(branchId);
  const staff = staffByBranch.get(branchId) ?? [];
  const today = toLocalDateString(new Date());
  const todaysAttendance = (attendanceByBranch.get(branchId) ?? []).filter((a) => a.date === today);
  const monthKey = today.slice(0, 7);
  const bonuses = bonusByBranch.get(branchId) ?? [];

  const activeStaff = staff.filter((member) => member.status === "active");
  return delay({
    totalStaff: activeStaff.length,
    presentToday: todaysAttendance.filter((a) => a.status === "present" || a.status === "late")
      .length,
    onLeaveToday: todaysAttendance.filter((a) => a.status === "on_leave" || a.status === "absent")
      .length,
    monthlySalaryPayout: activeStaff.reduce((sum, member) => sum + member.monthlySalary, 0),
    monthlyBonusPayout: bonuses
      .filter((bonus) => bonus.awardedAt.slice(0, 7) === monthKey)
      .reduce((sum, bonus) => sum + bonus.amount, 0),
  });
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

export async function createStaff(branchId: string, input: StaffInput): Promise<StaffMember> {
  ensureSeeded(branchId);
  const staff = staffByBranch.get(branchId) ?? [];
  const member: StaffMember = {
    id: generateIdempotencyKey(),
    staffCode: `STF-${shortCode(branchId)}-${String(staff.length + 1).padStart(3, "0")}`,
    branchId,
    createdAt: new Date().toISOString(),
    ...input,
  };
  staffByBranch.set(branchId, [...staff, member]);
  return delay(member);
}

export async function updateStaff(
  branchId: string,
  id: string,
  input: StaffInput,
): Promise<StaffMember> {
  ensureSeeded(branchId);
  const staff = staffByBranch.get(branchId) ?? [];
  let updated: StaffMember | undefined;
  const next = staff.map((member) => {
    if (member.id !== id) return member;
    updated = { ...member, ...input };
    return updated;
  });
  staffByBranch.set(branchId, next);
  if (!updated) throw new Error("Staff member not found.");
  return delay(updated);
}

export async function deleteStaff(branchId: string, id: string): Promise<void> {
  ensureSeeded(branchId);
  const staff = staffByBranch.get(branchId) ?? [];
  staffByBranch.set(
    branchId,
    staff.filter((member) => member.id !== id),
  );
  return delay(undefined);
}

/** Today's attendance record per staff id — absent staff and staff who haven't been marked yet are simply missing keys. */
export async function getTodayAttendance(
  branchId: string,
): Promise<Record<string, StaffAttendance>> {
  ensureSeeded(branchId);
  const today = toLocalDateString(new Date());
  const records = (attendanceByBranch.get(branchId) ?? []).filter((a) => a.date === today);
  return delay(Object.fromEntries(records.map((record) => [record.staffId, record])));
}

function upsertTodayAttendance(
  branchId: string,
  staffId: string,
  patch: Partial<Omit<StaffAttendance, "id" | "staffId" | "branchId" | "date">>,
): StaffAttendance {
  ensureSeeded(branchId);
  const today = toLocalDateString(new Date());
  const all = attendanceByBranch.get(branchId) ?? [];
  const existingIndex = all.findIndex((a) => a.staffId === staffId && a.date === today);

  if (existingIndex === -1) {
    const record: StaffAttendance = {
      id: `${staffId}-att-${today}`,
      staffId,
      branchId,
      date: today,
      checkInAt: null,
      checkOutAt: null,
      status: "present",
      ...patch,
    };
    attendanceByBranch.set(branchId, [...all, record]);
    return record;
  }

  const updated = { ...all[existingIndex], ...patch };
  const next = [...all];
  next[existingIndex] = updated;
  attendanceByBranch.set(branchId, next);
  return updated;
}

export async function checkInStaff(branchId: string, staffId: string): Promise<StaffAttendance> {
  const now = new Date();
  const status: AttendanceStatus = now.getHours() >= LATE_AFTER_HOUR ? "late" : "present";
  const record = upsertTodayAttendance(branchId, staffId, {
    checkInAt: now.toISOString(),
    checkOutAt: null,
    status,
  });
  return delay(record);
}

export async function checkOutStaff(branchId: string, staffId: string): Promise<StaffAttendance> {
  const record = upsertTodayAttendance(branchId, staffId, { checkOutAt: new Date().toISOString() });
  return delay(record);
}

export async function markAttendanceStatus(
  branchId: string,
  staffId: string,
  status: Extract<AttendanceStatus, "on_leave" | "absent">,
): Promise<StaffAttendance> {
  const record = upsertTodayAttendance(branchId, staffId, {
    status,
    checkInAt: null,
    checkOutAt: null,
  });
  return delay(record);
}

export async function listAttendanceHistory(
  branchId: string,
  staffId: string,
  days = 14,
): Promise<StaffAttendance[]> {
  ensureSeeded(branchId);
  const records = (attendanceByBranch.get(branchId) ?? [])
    .filter((a) => a.staffId === staffId)
    .sort((a, b) => b.date.localeCompare(a.date));
  return delay(records.slice(0, days));
}

export interface BonusInput {
  staffId: string;
  amount: number;
  reason: string;
  awardedBy: string;
}

export async function addBonus(branchId: string, input: BonusInput): Promise<StaffBonus> {
  ensureSeeded(branchId);
  const bonus: StaffBonus = {
    id: generateIdempotencyKey(),
    branchId,
    awardedAt: new Date().toISOString(),
    ...input,
  };
  bonusByBranch.set(branchId, [bonus, ...(bonusByBranch.get(branchId) ?? [])]);
  return delay(bonus);
}

export async function listBonuses(branchId: string, staffId: string): Promise<StaffBonus[]> {
  ensureSeeded(branchId);
  const bonuses = (bonusByBranch.get(branchId) ?? [])
    .filter((bonus) => bonus.staffId === staffId)
    .sort((a, b) => b.awardedAt.localeCompare(a.awardedAt));
  return delay(bonuses);
}
