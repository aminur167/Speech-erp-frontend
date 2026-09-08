"use client";

import { Badge } from "@/components/ui/Badge";
import { RowDetailDrawer, useRowDetail } from "@/components/ui/RowDetailDrawer";
import { formatCurrency } from "@/utils/currency";
import type { DailyClosing, DailyClosingStatus } from "@/types/domain";

const STATUS_TONE: Record<DailyClosingStatus, "success" | "warning" | "danger"> = {
  matched: "success",
  over: "warning",
  short: "danger",
};

const STATUS_LABEL: Record<DailyClosingStatus, string> = {
  matched: "Matched",
  over: "Over",
  short: "Short",
};

/** The cash-drawer side of the range: what the system expected against what was counted. */
export function ClosingLedgerTable({ closings }: { closings: DailyClosing[] }) {
  const detail = useRowDetail<DailyClosing>();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="py-2 pr-4 font-medium">Date</th>
            <th className="py-2 pr-4 text-right font-medium">System Total</th>
            <th className="py-2 pr-4 text-right font-medium">Counted</th>
            <th className="py-2 pr-4 text-right font-medium">Difference</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 pr-4 font-medium">Submitted By</th>
          </tr>
        </thead>
        <tbody>
          {closings.map((closing) => (
            <tr key={closing.id} {...detail.rowProps(closing)}>
              <td className="whitespace-nowrap py-2 pr-4 font-medium text-text-primary">
                {closing.date}
                {closing.isAmended && <Badge tone="info" label="Amended" className="ml-2" />}
              </td>
              <td className="py-2 pr-4 text-right tabular-nums">
                {formatCurrency(closing.systemTotal)}
              </td>
              <td className="py-2 pr-4 text-right tabular-nums">
                {formatCurrency(closing.actualTotal)}
              </td>
              <td
                className={
                  closing.difference === 0
                    ? "py-2 pr-4 text-right tabular-nums text-text-secondary"
                    : "py-2 pr-4 text-right font-medium tabular-nums text-danger"
                }
              >
                {formatCurrency(closing.difference)}
              </td>
              <td className="py-2 pr-4">
                <Badge
                  tone={STATUS_TONE[closing.status]}
                  label={STATUS_LABEL[closing.status]}
                />
              </td>
              <td className="py-2 pr-4 text-text-secondary">{closing.submittedBy || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <RowDetailDrawer
        open={detail.isOpen}
        onClose={detail.close}
        title={detail.selected?.date ?? ""}
        subtitle="Daily closing"
        data={detail.selected}
      />
    </div>
  );
}
