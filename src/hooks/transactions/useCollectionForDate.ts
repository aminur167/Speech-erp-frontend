import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getCollectionForDate } from "@/lib/api/transactions";

export function useCollectionForDate(branchId: string | undefined, date: string) {
  return useQuery({
    queryKey: queryKeys.transactions.collectionForDate(branchId, date),
    queryFn: () => getCollectionForDate(branchId, date),
    enabled: Boolean(date),
  });
}
