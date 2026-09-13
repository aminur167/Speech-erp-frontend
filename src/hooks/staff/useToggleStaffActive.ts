import { useMutation, useQueryClient } from "@tanstack/react-query";
import { activateStaff, deactivateStaff } from "@/lib/api/staff";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { StaffMember } from "@/types/domain";

export function useToggleStaffActive() {
  const queryClient = useQueryClient();

  return useMutation<StaffMember, ApiError, { id: string; makeActive: boolean }>({
    meta: { successMessage: "Staff status updated." },
    mutationFn: ({ id, makeActive }) => (makeActive ? activateStaff(id) : deactivateStaff(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
  });
}
