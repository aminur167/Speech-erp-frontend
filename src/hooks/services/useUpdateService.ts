import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateService, type ServiceInput } from "@/lib/api/services";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { Service } from "@/types/domain";

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation<Service, ApiError, { id: string; input: ServiceInput }>({
    mutationFn: ({ id, input }) => updateService(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
    },
  });
}
