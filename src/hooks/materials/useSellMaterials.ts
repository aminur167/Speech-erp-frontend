import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  sellMaterials,
  type MaterialsSaleResult,
  type SellMaterialsInput,
} from "@/lib/api/materials";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";

export function useSellMaterials() {
  const queryClient = useQueryClient();

  return useMutation<MaterialsSaleResult, ApiError, SellMaterialsInput>({
    mutationKey: ["sellMaterials"],
    mutationFn: sellMaterials,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyClosing.all });
    },
  });
}
