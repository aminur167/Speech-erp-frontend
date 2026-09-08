import { useMutation, useQueryClient } from "@tanstack/react-query";
import { checkInStaff, checkOutStaff, markAttendanceStatus } from "@/lib/api/staff";
import { queryKeys } from "@/lib/queryKeys";
import type { AttendanceStatus, StaffAttendance } from "@/types/domain";

function useInvalidateAttendance(branchId: string) {
  const queryClient = useQueryClient();
  return (staffId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.staff.todayAttendance(branchId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.staff.summary(branchId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.staff.attendanceHistory(staffId) });
  };
}

export function useCheckIn(branchId: string) {
  const invalidate = useInvalidateAttendance(branchId);
  return useMutation<StaffAttendance, Error, string>({
    mutationFn: (staffId) => checkInStaff(branchId, staffId),
    onSuccess: (_, staffId) => invalidate(staffId),
  });
}

export function useCheckOut(branchId: string) {
  const invalidate = useInvalidateAttendance(branchId);
  return useMutation<StaffAttendance, Error, string>({
    mutationFn: (staffId) => checkOutStaff(branchId, staffId),
    onSuccess: (_, staffId) => invalidate(staffId),
  });
}

export function useMarkAttendanceStatus(branchId: string) {
  const invalidate = useInvalidateAttendance(branchId);
  return useMutation<
    StaffAttendance,
    Error,
    { staffId: string; status: Extract<AttendanceStatus, "on_leave" | "absent"> }
  >({
    mutationFn: ({ staffId, status }) => markAttendanceStatus(branchId, staffId, status),
    onSuccess: (_, { staffId }) => invalidate(staffId),
  });
}
