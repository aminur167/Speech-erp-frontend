import { useMutation, useQueryClient } from "@tanstack/react-query";
import { checkInStaff, checkOutStaff, markAttendanceStatus } from "@/lib/api/staff";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { AttendanceStatus, StaffAttendance } from "@/types/domain";

function useInvalidateStaff() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
}

export function useCheckIn() {
  const invalidate = useInvalidateStaff();
  return useMutation<StaffAttendance, ApiError, string>({
    mutationFn: checkInStaff,
    onSuccess: invalidate,
  });
}

export function useCheckOut() {
  const invalidate = useInvalidateStaff();
  return useMutation<StaffAttendance, ApiError, string>({
    mutationFn: checkOutStaff,
    onSuccess: invalidate,
  });
}

export function useMarkAttendanceStatus() {
  const invalidate = useInvalidateStaff();
  return useMutation<
    StaffAttendance,
    ApiError,
    { staffId: string; status: Extract<AttendanceStatus, "on_leave" | "absent"> }
  >({
    mutationFn: ({ staffId, status }) => markAttendanceStatus(staffId, status),
    onSuccess: invalidate,
  });
}
