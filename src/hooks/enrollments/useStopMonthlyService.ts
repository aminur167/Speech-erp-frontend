import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  previewStopService,
  stopMonthlyService,
  type StopDecision,
  type StopPreview,
} from "@/lib/api/monthlyEnrollments";
import type { ApiError } from "@/types/api";
import type { MonthlyEnrollment } from "@/types/domain";

/**
 * What stopping would mean, before anyone commits: which months are owed and
 * need a decision, which are already paid ahead, and which never-payable
 * lookahead months simply get dropped.
 */
export function useStopPreview(enrollmentId: string | undefined) {
  return useQuery<StopPreview>({
    queryKey: ["enrollments", "stop-preview", enrollmentId],
    queryFn: () => previewStopService(enrollmentId as string),
    enabled: Boolean(enrollmentId),
  });
}

export function useStopMonthlyService() {
  const queryClient = useQueryClient();

  return useMutation<
    MonthlyEnrollment,
    ApiError,
    { enrollmentId: string; decisions: StopDecision[]; reason?: string }
  >({
    mutationFn: stopMonthlyService,
    // Stopping moves the service off the patient's profile, out of Due
    // Payments, and onto Terminated Services at once.
    onSuccess: () => {
      for (const key of [
        queryKeys.patients.all,
        queryKeys.duePayments.all,
        queryKeys.terminatedServices.all,
        queryKeys.patientAttendance.all,
      ]) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
