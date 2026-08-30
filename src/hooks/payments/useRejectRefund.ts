import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rejectRefund, type RejectRefundInput } from "@/lib/api/refunds";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { RefundRequest } from "@/types/domain";

export function useRejectRefund() {
  const queryClient = useQueryClient();

  return useMutation<RefundRequest, ApiError, RejectRefundInput>({
    mutationFn: rejectRefund,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.refundRequests.all });
    },
  });
}
