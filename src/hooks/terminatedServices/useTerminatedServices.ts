import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  listTerminatedServices,
  type TerminatedServiceListParams,
} from "@/lib/api/monthlyEnrollments";

export function useTerminatedServices(params: TerminatedServiceListParams) {
  return useQuery({
    queryKey: queryKeys.terminatedServices.list(params),
    queryFn: () => listTerminatedServices(params),
    placeholderData: (previousData) => previousData,
  });
}
