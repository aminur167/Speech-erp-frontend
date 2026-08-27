import type { PaymentStatus } from "@/types/domain";
import { clsx } from "clsx";

const statusStyles: Record<PaymentStatus, string> = {
  paid: "bg-success/10 text-success",
  due: "bg-warning/10 text-warning",
  upcoming: "bg-text-secondary/10 text-text-secondary",
  partial: "bg-status-partial/10 text-status-partial",
  cancelled: "bg-status-cancelled/10 text-status-cancelled",
  refunded: "bg-status-refunded/10 text-status-refunded",
  void: "bg-danger/10 text-danger",
};

export function StatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide",
        statusStyles[status],
      )}
    >
      {status}
    </span>
  );
}
