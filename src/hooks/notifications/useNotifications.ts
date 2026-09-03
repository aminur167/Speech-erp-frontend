import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listNotifications } from "@/lib/api/notifications";
import { LIVE_POLL_INTERVAL_MS } from "@/lib/livePolling";

/**
 * `enabled` is the bell being open, so this only polls while the panel is
 * actually on screen — otherwise a badge that ticked up would open onto the
 * previous list, which is the one moment the list has to be current.
 */
export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: () => listNotifications(),
    enabled,
    refetchInterval: enabled ? LIVE_POLL_INTERVAL_MS : false,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: true,
  });
}
