import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/currency";
import type { BillStatus } from "@/types/domain";

const statusTone: Record<BillStatus, "success" | "warning" | "danger" | "neutral"> = {
  paid: "success",
  due: "warning",
  overdue: "danger",
  upcoming: "neutral",
  written_off: "neutral",
};

const statusLabel: Record<BillStatus, string> = {
  paid: "Paid",
  due: "Due",
  overdue: "Overdue",
  upcoming: "Upcoming",
  written_off: "Written Off",
};

export interface ScheduleItem {
  key: string;
  label: string;
  amount: number;
  /** How much has actually been settled — less than `amount` after a partial refund. */
  amountPaid: number;
  /** What's still owed. Distinct from `amount` only once a partial refund has landed. */
  outstanding: number;
  status: BillStatus;
}

export function ScheduleList({
  items,
  onCollectPayment,
  isMutating,
}: {
  items: ScheduleItem[];
  onCollectPayment?: (key: string) => void;
  isMutating?: boolean;
}) {
  return (
    <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
      {items.map((item) => (
        <div key={item.key} className="flex items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-text-primary">{item.label}</p>
            <p className="text-sm text-text-secondary">
              {item.amountPaid > 0 && item.outstanding > 0
                ? `${formatCurrency(item.outstanding)} due of ${formatCurrency(item.amount)} (partially refunded)`
                : formatCurrency(item.amount)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={statusTone[item.status]} label={statusLabel[item.status]} />
            {(item.status === "due" || item.status === "overdue") && onCollectPayment && (
              <Button onClick={() => onCollectPayment(item.key)} disabled={isMutating}>
                Collect Payment
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
