import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listServices } from "@/lib/api/services";
import type { ServiceCategory } from "@/types/domain";

export function useServices(category?: ServiceCategory) {
  return useQuery({
    queryKey: queryKeys.services.list({ category }),
    queryFn: () => listServices(category),
  });
}
