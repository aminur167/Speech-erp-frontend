import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  collectMonthlyAdvance,
  getAdvanceOptions,
  previewMonthlyAdvance,
  type AdvanceOptions,
  type AdvancePreview,
  type CollectAdvanceInput,
} from "@/lib/api/monthlyEnrollments";
import type { ApiError } from "@/types/api";
import type { MonthlyEnrollment, Payment } from "@/types/domain";

/**
 * The future months that may be ticked, plus whatever is blocking them.
 *
 * The outstanding total comes back with the options rather than from a second
 * request, so the screen can explain a disabled Confirm in the same render it
 * draws the checkboxes.
 */
export function useAdvanceOptions(enrollmentId: string | undefined) {
  return useQuery<AdvanceOptions>({
    queryKey: ["enrollments", "advance-options", enrollmentId],
    queryFn: () => getAdvanceOptions(enrollmentId as string),
    enabled: Boolean(enrollmentId),
  });
}

/** What the ticked months would cost, before anyone commits to it. */
export function useAdvancePreview(
  enrollmentId: string | undefined,
  months: string[],
) {
  return useQuery<AdvancePreview>({
    queryKey: ["enrollments", "advance-preview", enrollmentId, months.join(",")],
    queryFn: () => previewMonthlyAdvance(enrollmentId as string, months),
    enabled: Boolean(enrollmentId) && months.length > 0,
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
      queryClient.invalidateQueries({ queryKey: ["enrollments", "advance-options"] });
    },
  });
}
