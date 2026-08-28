import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getPatientDirectorySummary } from "@/lib/api/patientDirectory";

export function usePatientDirectorySummary(branchId?: string, date?: string) {
  return useQuery({
    queryKey: queryKeys.patients.directorySummary(branchId, date),
    queryFn: () => getPatientDirectorySummary(branchId, date),
  });
}
