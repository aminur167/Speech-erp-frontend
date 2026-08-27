import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitDailyClosing, type SubmitDailyClosingInput } from "@/lib/api/dailyClosings";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { DailyClosing } from "@/types/domain";

export function useSubmitDailyClosing() {
  const queryClient = useQueryClient();

  return useMutation<DailyClosing, ApiError, SubmitDailyClosingInput>({
    mutationFn: submitDailyClosing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyClosing.all });
    },
  });
}
