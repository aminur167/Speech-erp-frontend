import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createStaff, type StaffInput } from "@/lib/api/staff";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { StaffMember } from "@/types/domain";

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation<StaffMember, ApiError, StaffInput>({
    mutationFn: createStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
  });
}
