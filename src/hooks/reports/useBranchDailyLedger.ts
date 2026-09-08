import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getBranchDailyLedger } from "@/lib/api/transactions";

/**
 * The branch's day-by-day ledger. Same scoping rule as `useBranchSummary`:
 * `branchId` is Admin's way of picking a branch, and a Manager's is ignored
 * server-side.
 */
export function useBranchDailyLedger(
  params: {
    branchId?: string;
    dateFrom?: string;
    dateTo?: string;
  },
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.transactions.branchDailyLedger(
      params.branchId,
      params.dateFrom,
      params.dateTo,
    ),
    queryFn: () => getBranchDailyLedger(params),
    placeholderData: (previousData) => previousData,
    enabled: options.enabled ?? true,
  });
}
