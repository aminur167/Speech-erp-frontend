import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getBranchSummary } from "@/lib/api/transactions";

/**
 * `branchId` is Admin's way of picking a branch; a Manager's is ignored
 * server-side, which is what keeps the same page safe for both roles.
 */
export function useBranchSummary(params: {
  branchId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: queryKeys.transactions.branchSummary(
      params.branchId,
      params.dateFrom,
      params.dateTo,
    ),
    queryFn: () => getBranchSummary(params),
  });
}
