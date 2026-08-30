import { apiClient } from "@/lib/api/client";
import type { DailyClosing, PaymentMethod } from "@/types/domain";

interface RawClosing extends Omit<DailyClosing, "id"> {
  id: number | string;
}
function normalizeClosing(raw: RawClosing): DailyClosing {
  return { ...raw, id: String(raw.id) };
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

export interface TodayCollectionSummary {
  total: number;
  transactionCount: number;
  byMethod: { method: PaymentMethod; amount: number }[];
}

/**
 * `date` (an ISO "YYYY-MM-DD" from a date picker) defaults to today when
 * omitted. Cash-drawer reconciliation, not accrual revenue: excludes
 * refunded/partial/void payments server-side, since a payment taken and then
 * refunded put no net cash in the drawer (docs/09).
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
