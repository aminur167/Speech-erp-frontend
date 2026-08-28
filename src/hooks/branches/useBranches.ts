import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listBranches } from "@/lib/api/branches";

export function useBranches(enabled = true) {
  return useQuery({
    queryKey: queryKeys.branches.list,
    queryFn: listBranches,
    enabled,
  });
}
