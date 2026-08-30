import { useMutation, useQueryClient } from "@tanstack/react-query";
import { activateService, deactivateService } from "@/lib/api/services";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { Service } from "@/types/domain";

export function useToggleServiceActive() {
  const queryClient = useQueryClient();

  return useMutation<Service, ApiError, { id: string; makeActive: boolean }>({
    mutationFn: ({ id, makeActive }) => (makeActive ? activateService(id) : deactivateService(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
    },
  });
}
