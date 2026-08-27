import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listDuePayments, type DuePaymentListParams } from "@/lib/api/duePayments";

export function useDuePayments(params: DuePaymentListParams) {
  return useQuery({
    queryKey: queryKeys.duePayments.list(params),
    queryFn: () => listDuePayments(params),
    placeholderData: (previousData) => previousData,
  });
}
