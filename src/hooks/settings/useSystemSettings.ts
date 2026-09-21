import { useQuery } from "@tanstack/react-query";
import { REFERENCE_DATA_STALE_MS } from "@/lib/cacheTiming";
import { queryKeys } from "@/lib/queryKeys";
import { getSystemSettings } from "@/lib/api/systemSettings";

export function useSystemSettings() {
  return useQuery({
    queryKey: queryKeys.systemSettings.all,
    queryFn: getSystemSettings,
    staleTime: REFERENCE_DATA_STALE_MS,
  });
}
