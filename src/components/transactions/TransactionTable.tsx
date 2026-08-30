import { Ban, Undo2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/utils/currency";
import type { TransactionItem } from "@/lib/api/transactions";

/** A payment can only be voided or refunded while it's still money that actually moved. */
const ACTIONABLE_STATUSES = new Set(["paid", "partial"]);

export function TransactionTable({
  transactions,
  canVoid,
  canRequestRefund,
  onVoid,
  onRequestRefund,
}: {
  transactions: TransactionItem[];
  /** Manager (same-day, enforced server-side) or Admin (any day). */
  canVoid?: boolean;
  /** Manager only — opens a request an Admin must approve. */
  canRequestRefund?: boolean;
  onVoid?: (transaction: TransactionItem) => void;
  onRequestRefund?: (transaction: TransactionItem) => void;
}) {
  const showActions = canVoid || canRequestRefund;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="py-2 pr-4 font-medium">Receipt No.</th>
            <th className="py-2 pr-4 font-medium">Date</th>
            <th className="py-2 pr-4 font-medium">Patient</th>
            <th className="py-2 pr-4 font-medium">Method</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 pr-4 font-medium">Amount</th>
            {showActions && <th className="py-2 pr-4 font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => {
            const actionable = ACTIONABLE_STATUSES.has(transaction.status);
            return (
              <tr key={transaction.id} className="border-b border-border last:border-0">
                <td className="py-2 pr-4 font-mono text-xs text-text-secondary">
                  {transaction.receiptNumber}
                </td>
                <td className="whitespace-nowrap py-2 pr-4">
                  {new Date(transaction.createdAt).toLocaleString()}
                </td>
                <td className="py-2 pr-4">
                  <p className="font-medium text-text-primary">{transaction.patientName}</p>
                  <p className="font-mono text-xs text-text-secondary">
                    {transaction.patientCode}
                  </p>
                </td>
                <td className="py-2 pr-4 capitalize">{transaction.method.replace("_", " ")}</td>
                <td className="py-2 pr-4">
                  <StatusBadge status={transaction.status} />
                </td>
                <td className="py-2 pr-4 font-medium">{formatCurrency(transaction.amount)}</td>
                {showActions && (
                  <td className="py-2 pr-4">
                    {actionable && (
                      <div className="flex gap-1">
                        {canVoid && (
                          <button
                            type="button"
                            title="Void payment"
                            onClick={() => onVoid?.(transaction)}
                            className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-danger/10 hover:text-danger"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                        {canRequestRefund && (
                          <button
                            type="button"
                            title="Request refund"
                            onClick={() => onRequestRefund?.(transaction)}
                            className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-warning/10 hover:text-warning"
                          >
                            <Undo2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
