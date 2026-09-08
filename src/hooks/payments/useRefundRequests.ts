import { useQuery } from "@tanstack/react-query";
import { listRefundRequests, type RefundRequestListParams } from "@/lib/api/refunds";
import { queryKeys } from "@/lib/queryKeys";

/**
 * `enabled` lets a screen that shows several of these lists behind tabs fetch
 * only the one on view — without it, opening such a page fires every list at
 * once for data nobody is looking at.
 */
export function useRefundRequests(
  params: RefundRequestListParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.refundRequests.list(params),
    queryFn: () => listRefundRequests(params),
    placeholderData: (previousData) => previousData,
    enabled: options.enabled ?? true,
  });
}
