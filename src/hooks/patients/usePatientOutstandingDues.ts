import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getPatientOutstandingDues } from "@/lib/api/patientServices";

/**
 * Everything a patient still owes, across every service.
 *
 * Read before offering a new enrollment or a reactivation so the screen can
 * name the months and the amount. The rule itself is enforced on the server —
 * this only lets the UI explain it instead of waiting to be refused.
 */
export function usePatientOutstandingDues(patientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.patients.outstandingDues(patientId ?? ""),
    queryFn: () => getPatientOutstandingDues(patientId as string),
    enabled: Boolean(patientId),
  });
}
