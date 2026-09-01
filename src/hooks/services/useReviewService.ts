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
    },
  });
}
