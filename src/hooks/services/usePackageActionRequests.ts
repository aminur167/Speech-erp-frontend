import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  listPackageActionRequests,
  requestPackageAction,
  reviewPackageAction,
  type PackageActionRequestListParams,
} from "@/lib/api/services";
import type { ApiError } from "@/types/api";
import type { PackageAction, PackageActionRequest } from "@/types/domain";

/**
 * Requests to change packages. An Admin's decision reaches the Manager's
 * menu — and a Manager's new request reaches Admin — within seconds, without
 * a reload: the approval pulse (hooks/useApprovalPulse.ts) refetches this
 * whenever a queue changes, so it needs no timer of its own.
 */
export function usePackageActionRequests(params: PackageActionRequestListParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.packageActionRequests.list(params),
    queryFn: () => listPackageActionRequests(params),
    enabled,
    // Keep the current page on screen while the next page or filter loads.
    placeholderData: (previousData) => previousData,
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
      // A delete request changes the package's status in the catalog.
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
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
      // A delete request shows on the package's own row and in the Services
      // badge, so both change with the decision.
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingPackages.count });
    },
  });
}
