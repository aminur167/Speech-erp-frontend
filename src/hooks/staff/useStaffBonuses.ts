import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listBonuses } from "@/lib/api/staff";

export function useStaffBonuses(
  branchId: string | undefined,
  staffId: string | undefined,
) {
  return useQuery({
    queryKey: queryKeys.staff.bonuses(staffId ?? ""),
    queryFn: () => listBonuses(branchId, staffId as string),
    enabled: Boolean(staffId),
  });
}
