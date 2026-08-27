import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getPatientActiveServices } from "@/lib/api/patientServices";

export function usePatientActiveServices(patientId: string) {
  return useQuery({
    queryKey: queryKeys.patients.activeServices(patientId),
    queryFn: () => getPatientActiveServices(patientId),
    enabled: Boolean(patientId),
  });
}
