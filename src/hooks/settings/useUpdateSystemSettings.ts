import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { updateSystemSettings, type SystemSettings } from "@/lib/api/systemSettings";
import type { ApiError } from "@/types/api";

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient();

  return useMutation<SystemSettings, ApiError, SystemSettings>({
    mutationFn: updateSystemSettings,
    onSuccess: (settings) => {
      queryClient.setQueryData(queryKeys.systemSettings.all, settings);
    },
  });
}
