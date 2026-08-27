import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createMaterial, type MaterialInput } from "@/lib/api/materials";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { Material } from "@/types/domain";

export function useCreateMaterial() {
  const queryClient = useQueryClient();

  return useMutation<Material, ApiError, MaterialInput>({
    mutationFn: createMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.all });
    },
  });
}
