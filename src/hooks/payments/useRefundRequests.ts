import { useQuery } from "@tanstack/react-query";
import { listRefundRequests, type RefundRequestListParams } from "@/lib/api/refunds";
import { queryKeys } from "@/lib/queryKeys";

export function useRefundRequests(params: RefundRequestListParams = {}) {
  return useQuery({
    queryKey: queryKeys.refundRequests.list(params),
    queryFn: () => listRefundRequests(params),
    placeholderData: (previousData) => previousData,
  });
}
