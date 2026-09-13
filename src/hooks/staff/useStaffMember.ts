import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getStaffMember } from "@/lib/api/staff";

export function useStaffMember(staffId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.staff.detail(staffId ?? ""),
    queryFn: () => getStaffMember(staffId as string),
    enabled: Boolean(staffId),
  });
}
