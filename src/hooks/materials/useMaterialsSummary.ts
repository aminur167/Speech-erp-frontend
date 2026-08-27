import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getMaterialsSummary } from "@/lib/api/materials";

export function useMaterialsSummary(branchId?: string) {
  return useQuery({
    queryKey: queryKeys.materials.summary(branchId),
    queryFn: () => getMaterialsSummary(branchId),
  });
}
