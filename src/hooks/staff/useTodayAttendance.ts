import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getTodayAttendance } from "@/lib/api/staff";

/**
 * One day's attendance, keyed by staff id.
 *
 * `date` omitted means today — the live sheet. Pass a past date to read
 * history, which the server neither auto-closes nor filters by today's
 * roster (see getTodayAttendance).
 */
export function useTodayAttendance(branchId?: string, date?: string) {
  return useQuery({
    queryKey: queryKeys.staff.todayAttendance(branchId, date),
    queryFn: () => getTodayAttendance(branchId, date),
  });
}
