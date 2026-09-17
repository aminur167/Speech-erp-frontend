import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getBranchActivity } from "@/lib/api/transactions";

/**
 * The Summary page's merged Activity feed. Same scoping rule as
 * `useBranchDailyLedger`: `branchId` is Admin's way of picking a branch, and
 * a Manager's is ignored server-side.
 */
export function useBranchActivity(
  params: {
    branchId?: string;
    dateFrom?: string;
    dateTo?: string;
  },
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.transactions.branchActivity(
      params.branchId,
      params.dateFrom,
      params.dateTo,
    ),
    queryFn: () => getBranchActivity(params),
    placeholderData: (previousData) => previousData,
    enabled: options.enabled ?? true,
  });
}
