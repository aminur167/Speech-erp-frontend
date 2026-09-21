import { useQuery } from "@tanstack/react-query";
import { REFERENCE_DATA_STALE_MS } from "@/lib/cacheTiming";
import { queryKeys } from "@/lib/queryKeys";
import { listBranches } from "@/lib/api/branches";

export function useBranches(enabled = true) {
  return useQuery({
    queryKey: queryKeys.branches.list,
    queryFn: listBranches,
    staleTime: REFERENCE_DATA_STALE_MS,
    enabled,
  });
}
