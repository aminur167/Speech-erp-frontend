import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addBonus, type BonusInput } from "@/lib/api/staff";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiError } from "@/types/api";
import type { StaffBonus } from "@/types/domain";

export function useAddBonus() {
  const queryClient = useQueryClient();

  return useMutation<StaffBonus, ApiError, BonusInput>({
    mutationFn: addBonus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
  });
}
