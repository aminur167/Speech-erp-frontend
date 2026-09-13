import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePatient } from "@/lib/api/patients";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";

/** Refusals (active service, money owed) surface through the global error toast. */
export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    meta: { successMessage: "Patient deleted." },
    mutationFn: deletePatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
    },
  });
}
