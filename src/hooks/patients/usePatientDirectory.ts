import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listPatientDirectory, type PatientDirectoryListParams } from "@/lib/api/patientDirectory";

export function usePatientDirectory(params: PatientDirectoryListParams) {
  return useQuery({
    queryKey: queryKeys.patients.directory(params),
    queryFn: () => listPatientDirectory(params),
    placeholderData: (previousData) => previousData,
  });
}
