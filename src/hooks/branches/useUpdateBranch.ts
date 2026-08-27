import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateBranch, type BranchInput } from "@/lib/api/branches";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { Branch } from "@/types/domain";

export function useUpdateBranch() {
  const queryClient = useQueryClient();

  return useMutation<Branch, ApiError, { id: string; input: BranchInput }>({
    mutationFn: ({ id, input }) => updateBranch(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });
    },
  });
}
