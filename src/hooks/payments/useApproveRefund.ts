import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveRefund, type ApproveRefundInput } from "@/lib/api/refunds";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { RefundRequest } from "@/types/domain";

export function useApproveRefund() {
  const queryClient = useQueryClient();

  return useMutation<RefundRequest, ApiError, ApproveRefundInput>({
    mutationFn: approveRefund,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.refundRequests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.duePayments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.all });
    },
  });
}
