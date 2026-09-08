import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listTransactions, type TransactionListParams } from "@/lib/api/transactions";

/**
 * `enabled` lets a screen that shows several of these lists behind tabs fetch
 * only the one on view — without it, opening such a page fires every list at
 * once for data nobody is looking at.
 */
export function useTransactions(
  params: TransactionListParams,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.transactions.list(params),
    queryFn: () => listTransactions(params),
    placeholderData: (previousData) => previousData,
    enabled: options.enabled ?? true,
  });
}
