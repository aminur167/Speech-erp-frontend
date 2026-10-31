import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  disburseStaffAdvance,
  listAdvances,
  listStaffAdvances,
  requestStaffAdvance,
  reviewStaffAdvance,
  type AdvanceListParams,
  type RequestAdvanceInput,
  type StaffAdvance,
} from "@/lib/api/staff";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";

/**
 * Anything that moves an advance also moves the money around it: the
 * staff member's own list, the branch queue Admin works from, and the
 * payroll figures, because an outstanding advance changes what next
 * month's salary request will deduct.
 */
function useInvalidateAdvances() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.salaryPayments.all });
  };
}

export function useStaffAdvances(branchId: string | undefined, staffId?: string) {
  return useQuery({
    queryKey: queryKeys.staff.advances(staffId ?? ""),
    queryFn: () => listStaffAdvances(branchId, staffId as string),
    enabled: Boolean(staffId),
  });
}

export function useAdvances(params: AdvanceListParams = {}) {
  return useQuery({
    queryKey: queryKeys.staff.advanceList(params.branchId, params.status),
    queryFn: () => listAdvances(params),
  });
}

export function useRequestAdvance() {
  const invalidate = useInvalidateAdvances();

  return useMutation<StaffAdvance, ApiError, RequestAdvanceInput>({
    meta: { successMessage: "Advance sent to Admin for approval." },
    mutationFn: requestStaffAdvance,
    onSuccess: invalidate,
  });
}

export function useReviewAdvance() {
  const invalidate = useInvalidateAdvances();

  return useMutation<
    StaffAdvance,
    ApiError,
    { advanceId: string; approve: boolean; reviewNote?: string }
  >({
    mutationFn: ({ advanceId, approve, reviewNote }) =>
      reviewStaffAdvance(advanceId, approve, reviewNote ?? ""),
    onSuccess: invalidate,
  });
}

export function useDisburseAdvance() {
  const invalidate = useInvalidateAdvances();

  return useMutation<StaffAdvance, ApiError, { advanceId: string; paymentMethod: string }>({
    meta: { successMessage: "Advance paid." },
    mutationFn: ({ advanceId, paymentMethod }) =>
      disburseStaffAdvance(advanceId, paymentMethod),
    onSuccess: invalidate,
  });
}
