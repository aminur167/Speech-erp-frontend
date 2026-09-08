import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  resumeMonthlyService,
  type ResumeMonthlyServiceInput,
  type ResumeMonthlyServiceResult,
} from "@/lib/api/monthlyEnrollments";
import type { ApiError } from "@/types/api";

/**
 * Resuming touches three screens at once: the row leaves this list, the
 * patient reappears on Due Payments, and settling the arrears moves money —
 * so dues, transactions and the dashboard all have to be refetched, not just
 * the list in front of the manager.
 */
export function useResumeMonthlyService() {
  const queryClient = useQueryClient();

  return useMutation<ResumeMonthlyServiceResult, ApiError, ResumeMonthlyServiceInput>({
    mutationFn: resumeMonthlyService,
    onSuccess: () => {
      for (const key of [
        queryKeys.terminatedServices.all,
        queryKeys.duePayments.all,
        queryKeys.transactions.all,
        queryKeys.payments.all,
      ]) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
