import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getPatientDirectorySummary } from "@/lib/api/patientDirectory";

export function usePatientDirectorySummary(branchId?: string) {
  return useQuery({
    queryKey: queryKeys.patients.directorySummary(branchId),
    queryFn: () => getPatientDirectorySummary(branchId),
  });
}
