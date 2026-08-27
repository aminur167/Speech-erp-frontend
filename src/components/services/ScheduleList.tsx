import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/currency";
import type { BillStatus } from "@/types/domain";

const statusTone: Record<BillStatus, "success" | "warning" | "neutral"> = {
  paid: "success",
  due: "warning",
  upcoming: "neutral",
};

export interface ScheduleItem {
  key: string;
  label: string;
  amount: number;
  status: BillStatus;
}

export function ScheduleList({
  items,
  onCollectPayment,
  isMutating,
}: {
  items: ScheduleItem[];
  onCollectPayment: (key: string) => void;
  isMutating?: boolean;
}) {
  return (
    <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
      {items.map((item) => (
        <div key={item.key} className="flex items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-text-primary">{item.label}</p>
            <p className="text-sm text-text-secondary">{formatCurrency(item.amount)}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={statusTone[item.status]} label={item.status} />
            {item.status === "due" && (
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
