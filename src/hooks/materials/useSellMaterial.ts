import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sellMaterial, type MaterialSaleResult, type SellMaterialInput } from "@/lib/api/materials";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";

export function useSellMaterial() {
  const queryClient = useQueryClient();

  return useMutation<MaterialSaleResult, ApiError, SellMaterialInput>({
    mutationFn: sellMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyClosing.all });
    },
  });
}
