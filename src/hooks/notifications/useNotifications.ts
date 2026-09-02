import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listNotifications } from "@/lib/api/notifications";

export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: () => listNotifications(),
    enabled,
  });
}
