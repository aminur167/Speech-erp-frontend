import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getUnreadNotificationCount } from "@/lib/api/notifications";
import { LIVE_POLL_INTERVAL_MS } from "@/lib/livePolling";

/**
 * No websockets in this stack (docs/00's polling decision), so an action by
 * *another* user reaches this one by poll. Kept short, and refetched on focus
 * so coming back to the tab is always current without a reload.
 */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: getUnreadNotificationCount,
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
    // Deliberately polls even while the tab is backgrounded. Gating on
    // visibility saves a request every 10s but makes "is the badge current?"
    // depend on visibility semantics that vary by browser and embedding --
    // for a handful of clinic users that trade is not worth it.
    refetchIntervalInBackground: true,
  });
}
