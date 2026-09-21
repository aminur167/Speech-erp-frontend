import { useQuery } from "@tanstack/react-query";
import { REFERENCE_DATA_STALE_MS } from "@/lib/cacheTiming";
import { queryKeys } from "@/lib/queryKeys";
import { listStaff } from "@/lib/api/staff";

// `branchId` is optional: the backend pins a Manager to their own branch, so
// only Admin (browsing one branch) has anything to pass.
export function useStaff(branchId?: string) {
  return useQuery({
    queryKey: queryKeys.staff.list(branchId),
    queryFn: () => listStaff(branchId),
    staleTime: REFERENCE_DATA_STALE_MS,
  });
}
