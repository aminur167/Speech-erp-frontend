"use client";

import { Wallet } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { OverdueBadge } from "@/components/patients/OverdueBadge";
import { RowDetailDrawer, useRowDetail } from "@/components/ui/RowDetailDrawer";
import { formatCurrency } from "@/utils/currency";
import type { DuePaymentItem } from "@/lib/api/duePayments";

export function DuePaymentTable({
  items,
  onCollectPayment,
  showType = true,
}: {
  items: DuePaymentItem[];
  onCollectPayment?: (item: DuePaymentItem) => void;
  /**
   * Off when the table is already one type — the Due Payments screen puts
   * installments and monthly bills in separate tables, where a column
   * repeating the heading on every row is just noise in scarce width.
   */
  showType?: boolean;
}) {
  const showActions = Boolean(onCollectPayment);
  const detail = useRowDetail<DuePaymentItem>();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="py-2 pr-4 font-medium">Patient</th>
            {showType && <th className="py-2 pr-4 font-medium">Type</th>}
            <th className="py-2 pr-4 font-medium">Service</th>
            <th className="py-2 pr-4 font-medium">Due</th>
            <th className="py-2 pr-4 font-medium">Amount</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            {showActions && <th className="w-12 py-2 pr-2 font-medium"><span className="sr-only">Actions</span></th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.key} {...detail.rowProps(item)}>
              <td className="py-2 pr-4">
                <p className="font-medium text-text-primary">{item.patientName}</p>
                <p className="font-mono text-xs text-text-secondary">{item.patientCode}</p>
              </td>
              {showType && (
                <td className="py-2 pr-4">
                  <Badge tone={item.type === "monthly" ? "info" : "purple"} label={item.type} />
                </td>
              )}
              <td className="py-2 pr-4">
                {item.serviceName}
                {item.serviceActive === false && (
                  <span className="ml-2 align-middle">
                    <Badge tone="warning" label="Inactive" />
                  </span>
                )}
              </td>
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
                <td className="py-2 pr-2 text-right">
                  <ActionMenu
                    label={`Actions for ${item.patientName}`}
                    items={[
                      {
                        key: "collect",
                        label: "Collect payment",
                        icon: Wallet,
                        hidden: !onCollectPayment,
                        onSelect: () => onCollectPayment?.(item),
                      },
                    ]}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <RowDetailDrawer
        open={detail.isOpen}
        onClose={detail.close}
        title={detail.selected?.patientName ?? ""}
        subtitle={detail.selected?.serviceName ?? undefined}
        data={detail.selected}
        hiddenFields={["key"]}
      />
    </div>
  );
}
