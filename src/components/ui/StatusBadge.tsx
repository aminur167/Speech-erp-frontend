import type { PaymentStatus } from "@/types/domain";
import { Badge } from "@/components/ui/Badge";

const paymentTone: Record<PaymentStatus, "success" | "warning" | "neutral" | "danger" | "purple"> = {
  paid: "success",
  due: "warning",
  upcoming: "neutral",
  partial: "warning",
  cancelled: "neutral",
  refunded: "purple",
  void: "danger",
};

export function StatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge tone={paymentTone[status]} label={status} />;
}
