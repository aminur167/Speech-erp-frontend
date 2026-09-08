import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestSalaryPayment } from "@/lib/api/salaryPayments";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { SalaryPayment } from "@/types/domain";

export function useRequestSalaryPayment() {
  const queryClient = useQueryClient();

  return useMutation<SalaryPayment, ApiError, { staffId: string; month: string }>({
    mutationFn: ({ staffId, month }) => requestSalaryPayment(staffId, month),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.salaryPayments.all });
    },
  });
}
