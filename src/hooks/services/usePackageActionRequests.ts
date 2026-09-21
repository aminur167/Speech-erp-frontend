import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  listPackageActionRequests,
  requestPackageAction,
  reviewPackageAction,
  type PackageActionRequestListParams,
} from "@/lib/api/services";
import { LIVE_POLL_INTERVAL_MS } from "@/lib/livePolling";
import type { ApiError } from "@/types/api";
import type { PackageAction, PackageActionRequest } from "@/types/domain";

/**
 * Requests to change packages. Polls, so an Admin's decision reaches the
 * Manager's menu — and a Manager's new request reaches Admin — without a reload.
 */
export function usePackageActionRequests(params: PackageActionRequestListParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.packageActionRequests.list(params),
    queryFn: () => listPackageActionRequests(params),
    enabled,
    // Keep the current page on screen while the next page or filter loads.
    placeholderData: (previousData) => previousData,
    refetchInterval: enabled ? LIVE_POLL_INTERVAL_MS : false,
    refetchOnWindowFocus: true,
  });
}

export function useRequestPackageAction() {
  const queryClient = useQueryClient();

  return useMutation<
    PackageActionRequest,
    ApiError,
    { serviceId: string; action: PackageAction; reason: string }
  >({
    meta: { successMessage: "Request sent to Admin for approval." },
    mutationFn: requestPackageAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.packageActionRequests.all });
    },
  });
}

export function useReviewPackageAction() {
  const queryClient = useQueryClient();

  return useMutation<
    PackageActionRequest,
    ApiError,
    { id: string; approve: boolean; reviewNote?: string }
  >({
    meta: { successMessage: "Decision saved." },
    mutationFn: reviewPackageAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.packageActionRequests.all });
    },
  });
}
