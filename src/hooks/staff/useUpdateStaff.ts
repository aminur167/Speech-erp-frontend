import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateStaff, type StaffInput } from "@/lib/api/staff";
import { queryKeys } from "@/lib/queryKeys";
import type { StaffMember } from "@/types/domain";

export function useUpdateStaff(branchId: string) {
  const queryClient = useQueryClient();

  return useMutation<StaffMember, Error, { id: string; input: StaffInput }>({
    mutationFn: ({ id, input }) => updateStaff(branchId, id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
  });
}
