import { apiClient } from "@/lib/api/client";
import type { PaginatedResponse } from "@/types/api";
import type { AuditLogAction, AuditLogEntry } from "@/types/domain";

export interface AuditLogListParams {
  action?: AuditLogAction;
  targetType?: string;
  branchId?: string;
  page?: number;
}

/** Admin-only oversight of every consequential action across every branch — see apps/common/audit.py. */
export async function listAuditLogs(
  params: AuditLogListParams = {},
): Promise<PaginatedResponse<AuditLogEntry>> {
  const { data } = await apiClient.get<PaginatedResponse<AuditLogEntry>>("/audit-logs/", {
    params: {
      action: params.action,
      target_type: params.targetType,
      branch: params.branchId,
      page: params.page,
    },
  });
  return data;
}
