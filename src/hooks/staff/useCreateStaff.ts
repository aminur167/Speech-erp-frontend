import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createStaff, type StaffInput } from "@/lib/api/staff";
import { queryKeys } from "@/lib/queryKeys";
import type { StaffMember } from "@/types/domain";

export function useCreateStaff(branchId?: string) {
  const queryClient = useQueryClient();

  return useMutation<StaffMember, Error, StaffInput>({
    mutationFn: (input) => createStaff(branchId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
  });
}
