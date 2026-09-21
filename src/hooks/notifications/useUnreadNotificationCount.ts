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
    // Hidden tabs stop polling. Every badge in the sidebar polls, and a
    // clinic PC keeps several tabs open all day, so background polling was a
    // steady stream of requests queueing in front of the pages someone was
    // actually using on a single small server. The focus refetch above makes
    // the badge current the moment the tab is looked at again.
    refetchIntervalInBackground: false,
  });
}
