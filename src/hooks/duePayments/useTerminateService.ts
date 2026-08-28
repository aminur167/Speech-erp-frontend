import { useMutation, useQueryClient } from "@tanstack/react-query";
import { terminateDuePaymentService } from "@/lib/api/duePayments";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { DuePaymentItem } from "@/lib/api/duePayments";

export function useTerminateService() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, Pick<DuePaymentItem, "type" | "refId">>({
    mutationFn: terminateDuePaymentService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.duePayments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
    },
  });
}
