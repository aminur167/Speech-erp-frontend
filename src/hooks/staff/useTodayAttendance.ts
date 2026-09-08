import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getTodayAttendance } from "@/lib/api/staff";

export function useTodayAttendance(branchId?: string) {
  return useQuery({
    queryKey: queryKeys.staff.todayAttendance(branchId),
    queryFn: () => getTodayAttendance(branchId),
  });
}
