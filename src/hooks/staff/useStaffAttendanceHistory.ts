import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listAttendanceHistory } from "@/lib/api/staff";

/** `month` is an ISO "YYYY-MM" — one calendar page of attendance for the drawer's calendar view. */
export function useStaffAttendanceHistory(
  branchId: string | undefined,
  staffId: string | undefined,
  month: string,
) {
  return useQuery({
    queryKey: queryKeys.staff.attendanceHistory(staffId ?? "", month),
    queryFn: () => listAttendanceHistory(branchId, staffId as string, month),
    enabled: Boolean(staffId),
  });
}
