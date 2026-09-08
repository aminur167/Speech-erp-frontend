import { useQuery } from "@tanstack/react-query";
import { listSalaryPayments, type SalaryPaymentListParams } from "@/lib/api/salaryPayments";
import { queryKeys } from "@/lib/queryKeys";

export function useSalaryPayments(params: SalaryPaymentListParams = {}) {
  return useQuery({
    queryKey: queryKeys.salaryPayments.list(params),
    queryFn: () => listSalaryPayments(params),
    placeholderData: (previousData) => previousData,
  });
}
