import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createService, type ServiceInput } from "@/lib/api/services";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { Service } from "@/types/domain";

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation<Service, ApiError, ServiceInput>({
    mutationFn: createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
    },
  });
}
