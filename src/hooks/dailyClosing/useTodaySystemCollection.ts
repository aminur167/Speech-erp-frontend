import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getTodaySystemCollection } from "@/lib/api/dailyClosings";

export function useTodaySystemCollection(branchId?: string, date?: string) {
  return useQuery({
    queryKey: queryKeys.dailyClosing.todaySummary(branchId, date),
    queryFn: () => getTodaySystemCollection(branchId, date),
  });
}
