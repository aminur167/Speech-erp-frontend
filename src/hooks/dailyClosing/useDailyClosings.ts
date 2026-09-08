import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listClosings, type DailyClosingListParams } from "@/lib/api/dailyClosings";

export function useDailyClosings(
  params: DailyClosingListParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.dailyClosing.list(params),
    queryFn: () => listClosings(params),
    placeholderData: (previousData) => previousData,
    enabled: options.enabled ?? true,
  });
}
