import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listServices } from "@/lib/api/services";
import type { ServiceCategory } from "@/types/domain";

export function useServices(
  category?: ServiceCategory,
  includeInactive?: boolean,
  includePending?: boolean,
) {
  return useQuery({
    queryKey: queryKeys.services.list({ category, includeInactive, includePending }),
    queryFn: () => listServices(category, includeInactive, includePending),
  });
}
