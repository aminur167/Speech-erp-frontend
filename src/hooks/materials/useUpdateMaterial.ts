import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMaterial, type MaterialInput } from "@/lib/api/materials";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { Material } from "@/types/domain";

export function useUpdateMaterial() {
  const queryClient = useQueryClient();

  return useMutation<Material, ApiError, { id: string; input: MaterialInput }>({
    mutationFn: ({ id, input }) => updateMaterial(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.all });
    },
  });
}
