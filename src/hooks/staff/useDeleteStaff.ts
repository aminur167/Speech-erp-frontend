import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteStaff } from "@/lib/api/staff";
import { queryKeys } from "@/lib/queryKeys";

export function useDeleteStaff(branchId?: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => deleteStaff(branchId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
  });
}
