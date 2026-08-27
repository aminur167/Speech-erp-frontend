import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listRefundsAndVoids } from "@/lib/api/transactions";

export function useRefundsAndVoids(branchId?: string) {
  return useQuery({
    queryKey: queryKeys.transactions.refundsAndVoids(branchId),
    queryFn: () => listRefundsAndVoids(branchId),
  });
}
