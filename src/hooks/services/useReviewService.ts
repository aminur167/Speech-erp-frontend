import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewService, type ReviewServiceInput } from "@/lib/api/services";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { Service } from "@/types/domain";

export function useReviewService() {
  const queryClient = useQueryClient();

  return useMutation<Service, ApiError, ReviewServiceInput>({
    mutationFn: reviewService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
      // The sidebar badge and the bell are driven by their own queries --
      // without these, the Admin who just decided still sees the old
      // pending count until the next poll, which reads as "it didn't work".
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingPackages.count });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
