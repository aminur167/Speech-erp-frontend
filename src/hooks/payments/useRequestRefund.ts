import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestRefund, type RequestRefundInput } from "@/lib/api/refunds";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { RefundRequest } from "@/types/domain";

export function useRequestRefund() {
  const queryClient = useQueryClient();

  return useMutation<RefundRequest, ApiError, RequestRefundInput>({
    mutationFn: requestRefund,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.refundRequests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });
}
