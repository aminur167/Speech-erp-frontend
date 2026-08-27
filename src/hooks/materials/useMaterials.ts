import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listMaterials } from "@/lib/api/materials";

export function useMaterials(branchId?: string) {
  return useQuery({
    queryKey: queryKeys.materials.list(branchId),
    queryFn: () => listMaterials(branchId),
  });
}
