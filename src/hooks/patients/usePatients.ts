import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listPatients, type PatientListParams } from "@/lib/api/patients";

export function usePatients(params: PatientListParams) {
  return useQuery({
    queryKey: queryKeys.patients.list(params),
    queryFn: () => listPatients(params),
    placeholderData: (previousData) => previousData,
  });
}
