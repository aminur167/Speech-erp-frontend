import type { ExpenseStatus } from "@/types/domain";
import { Badge } from "@/components/ui/Badge";

const expenseTone: Record<ExpenseStatus, "success" | "warning" | "danger"> = {
  approved: "success",
  pending: "warning",
  rejected: "danger",
};

export function ExpenseStatusBadge({ status }: { status: ExpenseStatus }) {
  return <Badge tone={expenseTone[status]} label={status} />;
}
