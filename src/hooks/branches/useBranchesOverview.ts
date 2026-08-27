import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getBranchesOverview } from "@/lib/api/branches";

export function useBranchesOverview() {
  return useQuery({
    queryKey: queryKeys.branches.overview,
    queryFn: getBranchesOverview,
  });
}
