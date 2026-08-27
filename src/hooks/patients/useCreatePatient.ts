import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPatient, type CreatePatientInput } from "@/lib/api/patients";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { Patient } from "@/types/domain";

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation<Patient, ApiError, CreatePatientInput>({
    mutationFn: createPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
    },
  });
}
