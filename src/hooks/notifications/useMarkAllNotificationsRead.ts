import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markAllNotificationsRead } from "@/lib/api/notifications";
import { queryKeys } from "@/lib/queryKeys";

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
