import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getMonthlyReport } from "@/lib/api/staff";

/** `month` is an ISO "YYYY-MM"; omit for the current month. */
export function useMonthlyStaffReport(branchId?: string, month?: string) {
  return useQuery({
    queryKey: queryKeys.staff.monthlyReport(branchId, month),
    queryFn: () => getMonthlyReport(branchId, month),
  });
}
