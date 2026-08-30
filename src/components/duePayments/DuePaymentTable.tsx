import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { OverdueBadge } from "@/components/patients/OverdueBadge";
import { formatCurrency } from "@/utils/currency";
import type { DuePaymentItem } from "@/lib/api/duePayments";

export function DuePaymentTable({
  items,
  onCollectPayment,
  onTerminate,
}: {
  items: DuePaymentItem[];
  onCollectPayment?: (item: DuePaymentItem) => void;
  /** Lets the manager end a patient's monthly enrollment or installment plan. */
  onTerminate?: (item: DuePaymentItem) => void;
}) {
  const showActions = Boolean(onCollectPayment || onTerminate);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="py-2 pr-4 font-medium">Patient</th>
            <th className="py-2 pr-4 font-medium">Type</th>
            <th className="py-2 pr-4 font-medium">Service</th>
            <th className="py-2 pr-4 font-medium">Due</th>
            <th className="py-2 pr-4 font-medium">Amount</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            {showActions && <th className="py-2 pr-4 font-medium">Action</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.key} className="border-b border-border last:border-0">
              <td className="py-2 pr-4">
                <p className="font-medium text-text-primary">{item.patientName}</p>
                <p className="font-mono text-xs text-text-secondary">{item.patientCode}</p>
              </td>
              <td className="py-2 pr-4">
                <Badge tone={item.type === "monthly" ? "info" : "purple"} label={item.type} />
              </td>
              <td className="py-2 pr-4">{item.serviceName}</td>
              <td className="py-2 pr-4">{item.label}</td>
              <td className="py-2 pr-4 font-medium">{formatCurrency(item.amount)}</td>
              <td className="py-2 pr-4">
                {item.status === "overdue" ? (
                  <OverdueBadge />
                ) : (
                  <Badge tone="warning" label="Due" />
                )}
              </td>
              {showActions && (
                <td className="py-2 pr-4">
                  <div className="flex gap-2">
                    {onCollectPayment && (
                      <Button onClick={() => onCollectPayment(item)}>Collect Payment</Button>
                    )}
                    {onTerminate && (
                      <Button variant="danger" onClick={() => onTerminate(item)}>
                        Terminate
                      </Button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
