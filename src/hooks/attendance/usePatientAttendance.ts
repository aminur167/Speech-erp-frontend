import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  getAttendanceRoster,
  listPatientAttendanceHistory,
  markPatientAttendance,
  type AttendanceRosterParams,
  type AttendanceRosterRow,
  type MarkAttendanceInput,
} from "@/lib/api/patientAttendance";
import { toLocalDateString } from "@/utils/time";
import type { ApiError, PaginatedResponse } from "@/types/api";
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

type RosterPage = PaginatedResponse<AttendanceRosterRow>;
type Snapshot = [readonly unknown[], RosterPage | undefined][];

/**
 * Marking is an upsert server-side, so pressing a button twice is safe.
 *
 * **Shown at once.** Marking a whole sheet is dozens of clicks a day, so the
 * row changes the moment it is pressed instead of after the server answers.
 * If the server refuses, every roster goes back to what it was and the usual
 * error toast says why. Attendance never touches money (see the backend's
 * apps/patients/attendance.py), which is what makes guessing ahead safe here
 * — payments are never shown before the server confirms them.
 *
 * Settles by refetching the whole attendance tree rather than one roster
 * key: a mark changes the row, the "not yet marked" filter, and the
 * stopped-coming clock at once, and those are different cache entries.
 */
export function useMarkPatientAttendance() {
  const queryClient = useQueryClient();

  return useMutation<PatientAttendance, ApiError, MarkAttendanceInput, { snapshot: Snapshot }>({
    mutationFn: markPatientAttendance,
    onMutate: async (input) => {
      const rosters = { queryKey: ["patient-attendance", "roster"] };
      // An answer already on its way must not overwrite the change below.
      await queryClient.cancelQueries(rosters);
      const snapshot = queryClient.getQueriesData<RosterPage>(rosters);

      const markedOn = input.date ?? toLocalDateString();
      for (const [key, page] of snapshot) {
        const params = (key[2] ?? {}) as AttendanceRosterParams;
        const sameSheet =
          params.kind === input.serviceKind && (params.date ?? toLocalDateString()) === markedOn;
        if (!page || !sameSheet) continue;
        queryClient.setQueryData<RosterPage>(key, {
          ...page,
          results: page.results.map((row) =>
            row.patientId === input.patientId ? { ...row, status: input.status } : row,
          ),
        });
      }
      return { snapshot };
    },
    onError: (_error, _input, context) => {
      context?.snapshot.forEach(([key, page]) => queryClient.setQueryData(key, page));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patientAttendance.all });
    },
  });
}
