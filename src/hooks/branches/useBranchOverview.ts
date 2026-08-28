import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getBranchOverview } from "@/lib/api/branches";

export function useBranchOverview(id: string) {
  return useQuery({
    queryKey: queryKeys.branches.overviewOne(id),
    queryFn: () => getBranchOverview(id),
  });
}
