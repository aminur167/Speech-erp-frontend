import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getStaffSummary } from "@/lib/api/staff";

export function useStaffSummary(branchId: string) {
  return useQuery({
    queryKey: queryKeys.staff.summary(branchId),
    queryFn: () => getStaffSummary(branchId),
    enabled: Boolean(branchId),
  });
}
