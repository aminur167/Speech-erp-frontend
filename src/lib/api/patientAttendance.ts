/**
 * Patient attendance — the day's sheet and the marks on it.
 *
 * Backed by apps/patients/ on the Django side. Branch scoping follows the
 * usual rule: `branchId` is how Admin picks a branch, and it is ignored
 * server-side for a Manager, who is pinned to their own.
 *
 * Nothing here touches money. Attendance is a record of who came in; billing
 * is a monthly subscription, so what a patient owes is the same whether they
 * attended twice or ten times.
 */
import { apiClient } from "@/lib/api/client";
import type { PaginatedResponse } from "@/types/api";
import type {
  AttendanceServiceKind,
  PatientAttendance,
  PatientAttendanceStatus,
} from "@/types/domain";

export interface AttendanceRosterRow {
  patientId: string;
  patientCode: string;
  patientName: string;
  patientPhone: string;
  branchId: string;
  /** Every active service of the chosen kind — one mark covers all of them. */
  serviceNames: string[];
  /** Null until somebody marks this patient today. */
  record: PatientAttendance | null;
  lastPresentOn: string | null;
  daysSinceLastVisit: number;
  /** Set while a stated absence is still running. */
  excusedUntil: string | null;
  /** Gone quiet without saying so. */
  alert: boolean;
}

interface RawRosterRow extends Omit<AttendanceRosterRow, "record"> {
  record: (Omit<PatientAttendance, "id"> & { id: number | string }) | null;
}

function normalizeRow(raw: RawRosterRow): AttendanceRosterRow {
  return {
    ...raw,
    record: raw.record ? { ...raw.record, id: String(raw.record.id) } : null,
  };
}

export interface AttendanceRosterParams {
  kind: AttendanceServiceKind;
  /** ISO date; defaults to today server-side. */
  date?: string;
  search?: string;
  /** Only patients nobody has marked yet. */
  unmarked?: boolean;
  /** Only patients who have stopped coming without saying so. */
  alerts?: boolean;
  branchId?: string;
  page?: number;
  pageSize?: number;
}

export async function getAttendanceRoster(
  params: AttendanceRosterParams,
): Promise<PaginatedResponse<AttendanceRosterRow>> {
  const { data } = await apiClient.get<PaginatedResponse<RawRosterRow>>(
    "/patients/attendance/roster/",
    {
      params: {
        kind: params.kind,
        date: params.date,
        search: params.search,
        unmarked: params.unmarked ? "true" : undefined,
        alerts: params.alerts ? "true" : undefined,
        branch: params.branchId,
        page: params.page,
        pageSize: params.pageSize,
      },
    },
  );
  return { ...data, results: data.results.map(normalizeRow) };
}

export interface MarkAttendanceInput {
  patientId: string;
  serviceKind: AttendanceServiceKind;
  status: PatientAttendanceStatus;
  date?: string;
  note?: string;
  /** Only meaningful for an informed absence; the server clears it otherwise. */
  expectedReturnOn?: string;
}

export async function markPatientAttendance(
  input: MarkAttendanceInput,
): Promise<PatientAttendance> {
  const { data } = await apiClient.post<
    Omit<PatientAttendance, "id"> & { id: number | string }
  >(`/patients/${input.patientId}/attendance/`, {
    serviceKind: input.serviceKind,
    status: input.status,
    date: input.date,
    note: input.note,
    expectedReturnOn: input.expectedReturnOn,
  });
  return { ...data, id: String(data.id) };
}

export async function listPatientAttendanceHistory(
  patientId: string,
  days = 60,
): Promise<PatientAttendance[]> {
  const { data } = await apiClient.get<
    (Omit<PatientAttendance, "id"> & { id: number | string })[]
  >(`/patients/${patientId}/attendance-history/`, { params: { days } });
  return data.map((record) => ({ ...record, id: String(record.id) }));
}
