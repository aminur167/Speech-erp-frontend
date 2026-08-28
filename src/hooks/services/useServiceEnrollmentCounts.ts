import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getServiceEnrollmentCounts } from "@/lib/api/serviceEnrollment";

export function useServiceEnrollmentCounts() {
  return useQuery({
    queryKey: queryKeys.services.enrollmentCounts,
    queryFn: getServiceEnrollmentCounts,
  });
}
