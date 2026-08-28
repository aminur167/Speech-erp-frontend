import { useAuthStore } from "@/store/authStore";
import { useBranches } from "@/hooks/branches/useBranches";

/** The logged-in manager's own branch name — for display on receipts, printouts, etc. */
export function useCurrentBranchName(): string {
  const user = useAuthStore((state) => state.user);
  const { data: branches } = useBranches(Boolean(user?.branchId));
  return branches?.find((b) => b.id === user?.branchId)?.name ?? "Branch";
}
