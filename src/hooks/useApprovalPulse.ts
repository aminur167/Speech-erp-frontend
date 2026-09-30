import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getApprovalPulse } from "@/lib/api/approvals";
import { APPROVAL_PULSE_INTERVAL_MS } from "@/lib/livePolling";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthStore } from "@/store/authStore";

/**
 * Keeps every approval queue and its badge within a few seconds of the
 * server, for Admin and Manager alike.
 *
 * Polls one tiny version number instead of the lists: when it moves, the
 * lists and counts behind it are refetched; when it doesn't, nothing else is
 * asked. So a Manager's new request appears on Admin's screen — and Admin's
 * decision on the Manager's — without anyone reloading, at the cost of one
 * small request every few seconds per open, visible tab.
 *
 * Mounted once, in AppShell.
 */
export function useApprovalPulse() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const lastSeen = useRef<string | null>(null);

  const { data: version } = useQuery({
    queryKey: ["approval-pulse", user?.id],
    queryFn: getApprovalPulse,
    enabled: Boolean(user),
    refetchInterval: APPROVAL_PULSE_INTERVAL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    // Always ask the server: a cached version is exactly what must not be
    // trusted here.
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    if (version === undefined) return;
    const previous = lastSeen.current;
    lastSeen.current = version;
    // The first reading is the baseline, not a change.
    if (previous === null || previous === version) return;

    for (const queryKey of [
      queryKeys.expenses.all,
      queryKeys.refundRequests.all,
      queryKeys.salaryPayments.all,
      queryKeys.packageActionRequests.all,
      queryKeys.services.all,
      queryKeys.pendingPackages.count,
      queryKeys.notifications.all,
      // A decided refund or disbursed salary moves money figures too.
      queryKeys.payments.all,
      queryKeys.transactions.all,
    ]) {
      void queryClient.invalidateQueries({ queryKey });
    }
  }, [version, queryClient]);
}
