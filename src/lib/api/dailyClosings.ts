import { apiClient } from "@/lib/api/client";
import type { DailyClosing, DailyClosingAmendment, PaymentMethod } from "@/types/domain";

// DailyClosingSerializer/AmendmentSerializer's amount fields are real
// DRF DecimalFields, so they cross the wire as JSON strings
// (COERCE_DECIMAL_TO_STRING) -- normalized to numbers here, same as the id
// fields.
interface RawAmendment
  extends Omit<DailyClosingAmendment, "id" | "previousActualTotal" | "correctedActualTotal"> {
  id: number | string;
  previousActualTotal: number | string;
  correctedActualTotal: number | string;
}
interface RawClosing
  extends Omit<DailyClosing, "id" | "amendments" | "systemTotal" | "actualTotal" | "difference"> {
  id: number | string;
  systemTotal: number | string;
  actualTotal: number | string;
  difference: number | string;
  amendments: RawAmendment[];
}
function normalizeAmendment(a: RawAmendment): DailyClosingAmendment {
  return {
    ...a,
    id: String(a.id),
    previousActualTotal: Number(a.previousActualTotal),
    correctedActualTotal: Number(a.correctedActualTotal),
  };
}
function normalizeClosing(raw: RawClosing): DailyClosing {
  return {
    ...raw,
    id: String(raw.id),
    systemTotal: Number(raw.systemTotal),
    actualTotal: Number(raw.actualTotal),
    difference: Number(raw.difference),
    amendments: raw.amendments.map(normalizeAmendment),
  };
}

/** Pure date formatting, no network call -- also reused by BranchForm for an unrelated date default. */
export function todayDateString(): string {
  // Build the date from local components — toISOString() converts to UTC,
  // which rolls back to the previous day for any positive UTC offset.
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface AdjustmentItem {
  receiptNumber: string;
  patientName: string;
  method: PaymentMethod;
  amount: number;
  status: string;
  createdAt: string;
}

export interface TodayCollectionSummary {
  total: number;
  transactionCount: number;
  byMethod: { method: PaymentMethod; amount: number }[];
  adjustments: {
    refundedTotal: number;
    voidTotal: number;
    items: AdjustmentItem[];
  };
}

/**
 * `date` (an ISO "YYYY-MM-DD" from a date picker) defaults to today when
 * omitted. Cash-drawer reconciliation, not accrual revenue: excludes
 * refunded/partial/void payments server-side, since a payment taken and then
 * refunded put no net cash in the drawer (docs/09). `adjustments` itemizes
 * exactly those excluded refunds/voids, so a manager staring at a short
 * drawer can see what moved the money instead of just a smaller number.
 */
export async function getTodaySystemCollection(
  branchId?: string,
  date?: string,
): Promise<TodayCollectionSummary> {
  const { data } = await apiClient.get<TodayCollectionSummary>(
    "/daily-closing/today-summary/",
    { params: { branch: branchId, date } },
  );
  return data;
}

export async function listDailyClosings(branchId?: string): Promise<DailyClosing[]> {
  const { data } = await apiClient.get<RawClosing[]>("/daily-closing/history/", {
    params: { branch: branchId },
  });
  return data.map(normalizeClosing);
}

export interface SubmitDailyClosingInput {
  actualTotal: number;
}

export async function submitDailyClosing(input: SubmitDailyClosingInput): Promise<DailyClosing> {
  // No branchId/submittedBy/systemTotal/difference/status: the backend
  // derives the branch and submitter from the authenticated manager, and
  // computes system_total, difference and status itself from Payments --
  // accepting any of those from the body would let the screen claim a day
  // balanced when it didn't (docs/09).
  const { data } = await apiClient.post<RawClosing>("/daily-closing/", {
    actualTotal: input.actualTotal,
  });
  return normalizeClosing(data);
}

export interface AmendClosingInput {
  id: string;
  correctedActualTotal: number;
  reason: string;
}

/**
 * Admin-only correction to an already-submitted closing. Never edits in
 * place: the original actualTotal survives on the new amendment row, and
 * difference/status are recomputed server-side from the correction, not
 * accepted from the request (docs/09).
 */
export async function amendClosing(input: AmendClosingInput): Promise<DailyClosing> {
  const { data } = await apiClient.post<RawClosing>(`/daily-closing/${input.id}/amend/`, {
    correctedActualTotal: input.correctedActualTotal,
    reason: input.reason,
  });
  return normalizeClosing(data);
}
