import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  collectMonthlyAdvance,
  previewMonthlyAdvance,
  type AdvancePreview,
  type CollectAdvanceInput,
} from "@/lib/api/monthlyEnrollments";
import type { ApiError } from "@/types/api";
import type { MonthlyEnrollment, Payment } from "@/types/domain";

/** What paying through a month would cost, arrears named separately. */
export function useAdvancePreview(
  enrollmentId: string | undefined,
  throughMonth: string | undefined,
) {
  return useQuery<AdvancePreview>({
    queryKey: ["enrollments", "advance-preview", enrollmentId, throughMonth],
    queryFn: () => previewMonthlyAdvance(enrollmentId as string, throughMonth as string),
    enabled: Boolean(enrollmentId && throughMonth),
  });
}

/**
 * Returns one payment per month, not one lump — each month keeps its own
 * receipt, which is what makes an advance auditable month by month.
 */
export function useCollectMonthlyAdvance() {
  const queryClient = useQueryClient();

  return useMutation<
    { payments: Payment[]; enrollment: MonthlyEnrollment },
    ApiError,
    CollectAdvanceInput
  >({
    mutationFn: collectMonthlyAdvance,
    onSuccess: () => {
      for (const key of [
        queryKeys.duePayments.all,
        queryKeys.transactions.all,
        queryKeys.payments.all,
        queryKeys.patients.all,
      ]) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
