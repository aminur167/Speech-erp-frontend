import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteService } from "@/lib/api/services";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
    },
  });
}
