import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listStaff } from "@/lib/api/staff";

export function useStaff(branchId: string) {
  return useQuery({
    queryKey: queryKeys.staff.list(branchId),
    queryFn: () => listStaff(branchId),
    enabled: Boolean(branchId),
  });
}
