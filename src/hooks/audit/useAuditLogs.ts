import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listAuditLogs, type AuditLogListParams } from "@/lib/api/auditLogs";

export function useAuditLogs(params: AuditLogListParams) {
  return useQuery({
    queryKey: queryKeys.auditLogs.list(params),
    queryFn: () => listAuditLogs(params),
  });
}
