import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getSystemSettings } from "@/lib/api/systemSettings";

export function useSystemSettings() {
  return useQuery({
    queryKey: queryKeys.systemSettings.all,
    queryFn: getSystemSettings,
  });
}
