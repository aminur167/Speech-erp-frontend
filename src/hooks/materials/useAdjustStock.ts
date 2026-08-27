import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adjustStock, type AdjustStockInput } from "@/lib/api/materials";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { Material } from "@/types/domain";

export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useMutation<Material, ApiError, AdjustStockInput>({
    mutationFn: adjustStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.all });
    },
  });
}
