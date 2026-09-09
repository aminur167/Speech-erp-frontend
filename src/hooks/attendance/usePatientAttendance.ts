import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  getAttendanceRoster,
  listPatientAttendanceHistory,
  markPatientAttendance,
  type AttendanceRosterParams,
  type MarkAttendanceInput,
} from "@/lib/api/patientAttendance";
import type { ApiError } from "@/types/api";
import type { PatientAttendance } from "@/types/domain";

export function useAttendanceRoster(params: AttendanceRosterParams) {
  return useQuery({
    queryKey: queryKeys.patientAttendance.roster(params),
    queryFn: () => getAttendanceRoster(params),
    placeholderData: (previousData) => previousData,
  });
}

export function usePatientAttendanceHistory(patientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.patientAttendance.history(patientId ?? ""),
    queryFn: () => listPatientAttendanceHistory(patientId as string),
    enabled: Boolean(patientId),
  });
}

/**
 * Marking is an upsert server-side, so pressing a button twice is safe.
 *
 * Invalidates the whole attendance tree rather than one roster key: a mark
 * changes the row, the "not yet marked" filter, and the stopped-coming clock
 * at once, and those are different cache entries.
 */
export function useMarkPatientAttendance() {
  const queryClient = useQueryClient();

  return useMutation<PatientAttendance, ApiError, MarkAttendanceInput>({
    mutationFn: markPatientAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patientAttendance.all });
    },
  });
}
