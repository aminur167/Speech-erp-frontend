import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBranch, type BranchInput } from "@/lib/api/branches";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { Branch } from "@/types/domain";

export function useCreateBranch() {
  const queryClient = useQueryClient();

  return useMutation<Branch, ApiError, BranchInput>({
    mutationFn: createBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });
    },
  });
}
