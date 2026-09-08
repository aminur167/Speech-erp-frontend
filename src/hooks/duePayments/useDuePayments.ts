import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listDuePayments, type DuePaymentListParams } from "@/lib/api/duePayments";

/**
 * `enabled` lets a screen that shows several of these lists behind tabs fetch
 * only the one on view — without it, opening such a page fires every list at
 * once for data nobody is looking at.
 */
export function useDuePayments(
  params: DuePaymentListParams,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.duePayments.list(params),
    queryFn: () => listDuePayments(params),
    placeholderData: (previousData) => previousData,
    enabled: options.enabled ?? true,
  });
}
