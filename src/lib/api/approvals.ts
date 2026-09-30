import { apiClient } from "@/lib/api/client";

/**
 * The approval pulse (backend apps/common/approvals.py): an opaque version
 * that changes whenever anything in an approval queue this user can see
 * changes — a request raised, decided, reversed or spent. Only a change in it
 * means anything.
 */
export async function getApprovalPulse(): Promise<string> {
  const { data } = await apiClient.get<{ version: string }>("/approvals/pulse/");
  return data.version;
}
