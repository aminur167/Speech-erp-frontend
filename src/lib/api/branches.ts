import { apiClient } from "@/lib/api/client";
import { toSnakeCase } from "@/lib/api/caseUtils";
import type { PaginatedResponse } from "@/types/api";
import type { Branch } from "@/types/domain";

// Branch is the one model with an integer primary key rather than a UUID
// (docs: only a handful of branches will ever exist), so the backend returns
// `id` as a JSON number. Every *other* place in the API that refers to a
// branch (Patient.branchId, User.branchId, ...) does so through an explicit
// CharField and arrives as a string — so `someList.find(b => b.id ===
// patient.branchId)` silently never matches unless this is normalized here.
// `Branch.id` in types/domain.ts has always been typed `string` for exactly
// this reason.
interface RawBranch extends Omit<Branch, "id"> {
  id: number | string;
}

function normalizeBranch(raw: RawBranch): Branch {
  return { ...raw, id: String(raw.id) };
}

export async function listBranches(): Promise<Branch[]> {
  const { data } = await apiClient.get<PaginatedResponse<RawBranch>>("/branches/", {
    params: { pageSize: 100 },
  });
  return data.results.map(normalizeBranch);
}

export async function getBranch(id: string): Promise<Branch> {
  const { data } = await apiClient.get<RawBranch>(`/branches/${id}/`);
  return normalizeBranch(data);
}

export interface BranchInput {
  name: string;
  code: string;
  status: Branch["status"];
  address: string;
  phone: string;
  managerName: string;
  managerCode: string;
  managerEmail: string;
  /** Required when creating a branch; leave blank on edit to keep the current password. */
  managerPassword?: string;
  therapistCount: number;
  supportCount: number;
  openedAt: string;
}

export async function createBranch(input: BranchInput): Promise<Branch> {
  const { data } = await apiClient.post<RawBranch>("/branches/", toSnakeCase(input));
  return normalizeBranch(data);
}

export async function updateBranch(id: string, input: BranchInput): Promise<Branch> {
  const { data } = await apiClient.put<RawBranch>(`/branches/${id}/`, toSnakeCase(input));
  return normalizeBranch(data);
}

export interface BranchOverview {
  branch: Branch;
  patientCount: number;
  totalCollected: number;
  monthlyRevenue: number;
}

interface RawBranchOverview extends Omit<BranchOverview, "branch" | "totalCollected" | "monthlyRevenue"> {
  branch: RawBranch;
  // DRF's DecimalField serializes as a JSON string ("21480.00"), not a
  // number -- summing two of these with `+` silently does string
  // concatenation instead of addition (see BranchesView's totals reduce).
  totalCollected: string | number;
  monthlyRevenue: string | number;
}

function normalizeOverview(raw: RawBranchOverview): BranchOverview {
  return {
    ...raw,
    branch: normalizeBranch(raw.branch),
    totalCollected: Number(raw.totalCollected),
    monthlyRevenue: Number(raw.monthlyRevenue),
  };
}

export async function getBranchesOverview(): Promise<BranchOverview[]> {
  const { data } = await apiClient.get<RawBranchOverview[]>("/branches/overview/");
  return data.map(normalizeOverview);
}

export async function getBranchOverview(id: string): Promise<BranchOverview> {
  const { data } = await apiClient.get<RawBranchOverview>(`/branches/${id}/overview/`);
  return normalizeOverview(data);
}
