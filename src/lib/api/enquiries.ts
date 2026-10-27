import { apiClient } from "@/lib/api/client";
import { toSnakeCase } from "@/lib/api/caseUtils";
import type { PaginatedResponse } from "@/types/api";
import type { Enquiry, EnquirySummary, Patient } from "@/types/domain";

export interface EnquiryListParams {
  /** Caller or patient name, phone in any format, concern, code, or source detail. */
  search?: string;
  status?: string;
  source?: string;
  /** "today" | "overdue" | "upcoming" | "none" — see `FOLLOW_UP_OPTIONS`. */
  followUp?: string;
  /** On `calledAt` — when the phone rang, not when the row was typed in. */
  dateFrom?: string;
  dateTo?: string;
  /** Admin only; a Manager is always scoped to their own branch by the server. */
  branchId?: string;
  page?: number;
  pageSize?: number;
}

function toQuery(params: EnquiryListParams) {
  return {
    search: params.search || undefined,
    status: params.status || undefined,
    source: params.source || undefined,
    followUp: params.followUp || undefined,
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
    branch: params.branchId || undefined,
    page: params.page,
    pageSize: params.pageSize,
  };
}

export async function listEnquiries(
  params: EnquiryListParams = {},
): Promise<PaginatedResponse<Enquiry>> {
  const { data } = await apiClient.get<PaginatedResponse<Enquiry>>("/enquiries/", {
    params: toQuery(params),
  });
  return data;
}

/**
 * The page header's counts — computed server-side over the *same* filters as
 * the list, so the numbers always describe the rows beneath them rather than
 * the whole table.
 */
export async function getEnquirySummary(
  params: EnquiryListParams = {},
): Promise<EnquirySummary> {
  const { data } = await apiClient.get<EnquirySummary>("/enquiries/summary/", {
    params: toQuery(params),
  });
  return data;
}

export interface EnquiryInput {
  callerName: string;
  callerPhone: string;
  callerRelation?: Enquiry["callerRelation"];
  patientName?: string;
  patientAge?: number | null;
  concern?: string;
  source: Enquiry["source"];
  sourceDetail?: string;
  status?: Enquiry["status"];
  followUpOn?: string | null;
  notes?: string;
  /** When the phone rang. Omitted means now. */
  calledAt?: string;
}

export async function createEnquiry(input: EnquiryInput): Promise<Enquiry> {
  // No branch: the server files the call under the authenticated manager's
  // own branch and ignores anything posted here, the same rule every other
  // branch-scoped create follows.
  const { data } = await apiClient.post<Enquiry>("/enquiries/", toSnakeCase(input));
  return data;
}

export async function updateEnquiry(
  id: string,
  input: Partial<EnquiryInput>,
): Promise<Enquiry> {
  const { data } = await apiClient.patch<Enquiry>(
    `/enquiries/${id}/`,
    toSnakeCase(input),
  );
  return data;
}

/** Soft delete — the record is hidden, never destroyed. */
export async function deleteEnquiry(id: string): Promise<void> {
  await apiClient.delete(`/enquiries/${id}/`);
}

export interface ConvertEnquiryInput {
  enquiryId: string;
  /** A full patient registration — the server applies the same rules the form does. */
  patient: Record<string, unknown>;
}

export interface ConvertEnquiryResult {
  enquiry: Enquiry;
  patient: Patient;
}

/**
 * Register the caller as a patient and tie the two together.
 *
 * The link is what makes the ad report possible: without it "enrolled" is a
 * status someone remembered to set, not a fact countable against the source
 * that produced it.
 */
export async function convertEnquiry({
  enquiryId,
  patient,
}: ConvertEnquiryInput): Promise<ConvertEnquiryResult> {
  const { data } = await apiClient.post<ConvertEnquiryResult>(
    `/enquiries/${enquiryId}/convert/`,
    toSnakeCase(patient),
  );
  return data;
}
