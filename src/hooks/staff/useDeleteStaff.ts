import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteStaff } from "@/lib/api/staff";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";

export function useDeleteStaff() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: deleteStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
  });
}
