import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listTransactions, type TransactionListParams } from "@/lib/api/transactions";

export function useTransactions(params: TransactionListParams) {
  return useQuery({
    queryKey: queryKeys.transactions.list(params),
    queryFn: () => listTransactions(params),
    placeholderData: (previousData) => previousData,
  });
}
