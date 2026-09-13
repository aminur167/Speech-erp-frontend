import { useMutation, useQueryClient } from "@tanstack/react-query";
import { activateBranch, deactivateBranch } from "@/lib/api/branches";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { Branch } from "@/types/domain";

export function useToggleBranchActive() {
  const queryClient = useQueryClient();

  return useMutation<Branch, ApiError, { id: string; makeActive: boolean }>({
    meta: { successMessage: "Branch status updated." },
    mutationFn: ({ id, makeActive }) => (makeActive ? activateBranch(id) : deactivateBranch(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });
    },
  });
}
