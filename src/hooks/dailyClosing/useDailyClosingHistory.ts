import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listDailyClosings } from "@/lib/api/dailyClosings";

export function useDailyClosingHistory(branchId?: string) {
  return useQuery({
    queryKey: queryKeys.dailyClosing.history(branchId),
    queryFn: () => listDailyClosings(branchId),
  });
}
