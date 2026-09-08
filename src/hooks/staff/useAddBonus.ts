import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addBonus, type BonusInput } from "@/lib/api/staff";
import { queryKeys } from "@/lib/queryKeys";
import type { StaffBonus } from "@/types/domain";

export function useAddBonus(branchId?: string) {
  const queryClient = useQueryClient();

  return useMutation<StaffBonus, Error, BonusInput>({
    mutationFn: (input) => addBonus(branchId, input),
    onSuccess: (bonus) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.bonuses(bonus.staffId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.summary(branchId) });
    },
  });
}
