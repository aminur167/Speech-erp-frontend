import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markNotificationRead } from "@/lib/api/notifications";
import { queryKeys } from "@/lib/queryKeys";

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
