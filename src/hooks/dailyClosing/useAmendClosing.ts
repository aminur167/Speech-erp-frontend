import { useMutation, useQueryClient } from "@tanstack/react-query";
import { amendClosing, type AmendClosingInput } from "@/lib/api/dailyClosings";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { DailyClosing } from "@/types/domain";

export function useAmendClosing() {
  const queryClient = useQueryClient();

  return useMutation<DailyClosing, ApiError, AmendClosingInput>({
    mutationFn: amendClosing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyClosing.all });
    },
  });
}
