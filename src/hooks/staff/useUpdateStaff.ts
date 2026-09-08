import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateStaff, type StaffInput } from "@/lib/api/staff";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { StaffMember } from "@/types/domain";

export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation<StaffMember, ApiError, { id: string; input: StaffInput }>({
    mutationFn: ({ id, input }) => updateStaff(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
  });
}
