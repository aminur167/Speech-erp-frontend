import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteBranch } from "@/lib/api/branches";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";

/** A branch still in use is refused server-side; the toast carries the reason. */
export function useDeleteBranch() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    meta: { successMessage: "Branch deleted." },
    mutationFn: deleteBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });
    },
  });
}
