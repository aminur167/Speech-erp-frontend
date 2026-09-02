import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getUnreadNotificationCount } from "@/lib/api/notifications";

const POLL_INTERVAL_MS = 30_000;

/** No websockets in this stack (docs/00's polling decision) — a badge that's up to 30s stale is an acceptable tradeoff for a clinic app. */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: getUnreadNotificationCount,
    refetchInterval: POLL_INTERVAL_MS,
  });
}
