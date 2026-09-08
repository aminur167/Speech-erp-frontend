import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listAttendanceHistory } from "@/lib/api/staff";

export function useStaffAttendanceHistory(
  branchId: string | undefined,
  staffId: string | undefined,
) {
  return useQuery({
    queryKey: queryKeys.staff.attendanceHistory(staffId ?? ""),
    queryFn: () => listAttendanceHistory(branchId, staffId as string),
    enabled: Boolean(staffId),
  });
}
