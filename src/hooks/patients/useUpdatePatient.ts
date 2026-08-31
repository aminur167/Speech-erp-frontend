import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePatient, type UpdatePatientInput } from "@/lib/api/patients";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { Patient } from "@/types/domain";

export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation<Patient, ApiError, { id: string; input: UpdatePatientInput }>({
    mutationFn: ({ id, input }) => updatePatient(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
    },
  });
}
