import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPatient, type CreatePatientInput } from "@/lib/api/patients";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { Patient } from "@/types/domain";

/**
 * `successMessage` is a parameter because this hook serves two different
 * acts. The registration form really does register a patient; the Sell
 * page's walk-in panel creates a counter buyer who is deliberately *not* a
 * patient -- announcing "Patient registered." there told the manager the
 * opposite of what had just happened.
 */
export function useCreatePatient(
  { successMessage = "Patient registered." }: { successMessage?: string } = {},
) {
  const queryClient = useQueryClient();

  return useMutation<Patient, ApiError, CreatePatientInput>({
    meta: { successMessage },
    mutationKey: ["createPatient"],
    mutationFn: createPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
    },
  });
}
