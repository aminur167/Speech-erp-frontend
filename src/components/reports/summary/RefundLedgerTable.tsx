"use client";

import { Badge } from "@/components/ui/Badge";
import { RowDetailDrawer, useRowDetail } from "@/components/ui/RowDetailDrawer";
import { formatCurrency } from "@/utils/currency";
import type { RefundRequest, RefundRequestStatus } from "@/types/domain";

const STATUS_TONE: Record<RefundRequestStatus, "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

/**
 * Refunds as a table rather than the approval queue's card list: this is the
 * record of what happened over a range, not a work queue, so it lines up
 * column-for-column with the other ledgers next to it.
 */
export function RefundLedgerTable({ refunds }: { refunds: RefundRequest[] }) {
  const detail = useRowDetail<RefundRequest>();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="py-2 pr-4 font-medium">Receipt No.</th>
            <th className="py-2 pr-4 font-medium">Requested</th>
            <th className="py-2 pr-4 font-medium">Reason</th>
            <th className="py-2 pr-4 font-medium">Requested By</th>
            <th className="py-2 pr-4 font-medium">Reviewed</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 pr-4 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {refunds.map((refund) => (
            <tr key={refund.id} {...detail.rowProps(refund)}>
              <td className="py-2 pr-4 font-mono text-xs text-text-secondary">
                {refund.payment.receiptNumber}
              </td>
              <td className="whitespace-nowrap py-2 pr-4">
                {new Date(refund.requestedAt).toLocaleDateString()}
              </td>
              <td className="max-w-[240px] py-2 pr-4">
                <p className="truncate" title={refund.reason}>
                  {refund.reason}
                </p>
              </td>
              <td className="py-2 pr-4 text-text-secondary">{refund.requestedBy || "—"}</td>
              <td className="whitespace-nowrap py-2 pr-4 text-text-secondary">
                {refund.reviewedAt
                  ? new Date(refund.reviewedAt).toLocaleDateString()
                  : "—"}
              </td>
              <td className="py-2 pr-4">
                <Badge tone={STATUS_TONE[refund.status]} label={refund.status} />
              </td>
              <td className="py-2 pr-4 text-right font-medium tabular-nums">
                {formatCurrency(refund.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <RowDetailDrawer
        open={detail.isOpen}
        onClose={detail.close}
        title={detail.selected?.payment.receiptNumber ?? ""}
        subtitle="Refund request"
        data={detail.selected}
      />
    </div>
  );
}
