import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getBranchDashboardMetrics } from "@/lib/api/transactions";

export function useBranchDashboardMetrics(branchId?: string) {
  return useQuery({
    queryKey: queryKeys.transactions.dashboardMetrics(branchId),
    queryFn: () => getBranchDashboardMetrics(branchId),
  });
}
