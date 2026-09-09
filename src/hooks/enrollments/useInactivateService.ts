import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  previewStopService,
  resumeMonthlyService,
  stopMonthlyService,
  type StopDecision,
  type StopPreview,
} from "@/lib/api/monthlyEnrollments";
import {
  previewStopInstallmentPlan,
  resumeInstallmentPlan,
  stopInstallmentPlan,
} from "@/lib/api/installmentPlans";
import type { ApiError } from "@/types/api";

/**
 * Making a service inactive, and bringing it back.
 *
 * One set of hooks for both kinds of service. Monthly and installment differ
 * only in the endpoint and the word for a row — "October 2026" against "2nd
 * Instalment" — so the dialog, the keep-or-cancel rules and the reason
 * requirement are shared rather than written twice.
 */

export type ServiceKind = "monthly" | "installment";

/** Which unpaid rows need a decision before the service can be made inactive. */
export function useInactivatePreview(
  kind: ServiceKind,
  serviceRefId: string | undefined,
) {
  return useQuery<StopPreview>({
    queryKey: ["enrollments", "stop-preview", kind, serviceRefId],
    queryFn: () =>
      kind === "monthly"
        ? previewStopService(serviceRefId as string)
        : previewStopInstallmentPlan(serviceRefId as string),
    enabled: Boolean(serviceRefId),
  });
}

/** Everything a completed inactivation or reactivation could have moved. */
function invalidateServiceViews(queryClient: ReturnType<typeof useQueryClient>) {
  for (const key of [
    queryKeys.patients.all,
    queryKeys.duePayments.all,
    queryKeys.patientAttendance.all,
  ]) {
    queryClient.invalidateQueries({ queryKey: key });
  }
}

export function useInactivateService() {
  const queryClient = useQueryClient();

  return useMutation<
    unknown,
    ApiError,
    {
      kind: ServiceKind;
      serviceRefId: string;
      decisions: StopDecision[];
      reason?: string;
    }
  >({
    mutationFn: ({ kind, serviceRefId, decisions, reason }) =>
      kind === "monthly"
        ? stopMonthlyService({ enrollmentId: serviceRefId, decisions, reason })
        : stopInstallmentPlan({ planId: serviceRefId, decisions, reason }),
    onSuccess: () => invalidateServiceViews(queryClient),
  });
}

/**
 * Reactivate an inactive service.
 *
 * No options to pass: the server refuses while the patient owes anything, and
 * the arrears are cleared on Due Payments first. The error carries the months
 * and the total so the screen can say what has to be paid.
 */
export function useReactivateService() {
  const queryClient = useQueryClient();

  return useMutation<unknown, ApiError, { kind: ServiceKind; serviceRefId: string }>({
    mutationFn: ({ kind, serviceRefId }) =>
      kind === "monthly"
        ? resumeMonthlyService(serviceRefId)
        : resumeInstallmentPlan(serviceRefId),
    onSuccess: () => invalidateServiceViews(queryClient),
  });
}
