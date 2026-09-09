"use client";

import { SortHeader, useTableSort } from "@/components/ui/SortableTable";
import { formatCurrency } from "@/utils/currency";
import { humanizeField } from "@/utils/fields";
import type { BranchSummaryRow } from "@/lib/api/transactions";

/**
 * A revenue split — by payment method, or by service type.
 *
 * The share column carries a bar behind it, which is what the old chart was
 * for: it answers "how much of the money came this way" at a glance. Unlike
 * a chart it stays a table — sortable, copyable, exportable, and readable to
 * a screen reader as the numbers it actually is.
 */
export function BreakdownTable({
  rows,
  label,
}: {
  rows: BranchSummaryRow[];
  /** Heading for the first column, e.g. "Method". */
  label: string;
}) {
  const total = rows.reduce((running, row) => running + row.amount, 0);
  const { sorted, sort, toggle } = useTableSort(rows, { key: "amount", direction: "desc" });
  const peak = Math.max(...rows.map((row) => row.amount), 1);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <SortHeader<BranchSummaryRow>
              label={label} columnKey="label" sort={sort} onSort={toggle} className="pl-3"
            />
            <SortHeader<BranchSummaryRow>
              label="Amount" columnKey="amount" sort={sort} onSort={toggle} align="right"
            />
            <th scope="col" className="bg-surface py-2 pr-4 font-medium">
              Share
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const share = total > 0 ? (row.amount / total) * 100 : 0;
            return (
              <tr key={row.label} className="border-b border-border last:border-0">
                <td className="py-2 pl-3 pr-4 text-text-primary">
                  {humanizeField(row.label)}
                </td>
                <td className="py-2 pr-4 text-right font-medium tabular-nums">
                  {formatCurrency(row.amount)}
                </td>
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 min-w-[6rem] flex-1 overflow-hidden rounded-full bg-background">
                      <div
                        className="h-full rounded-full bg-primary"
                        // Scaled against the largest row, not the total, so
                        // the shape stays readable when one method dominates.
                        style={{ width: `${Math.max((row.amount / peak) * 100, 2)}%` }}
                      />
                    </div>
                    <span className="w-12 shrink-0 text-right tabular-nums text-text-secondary">
                      {total > 0 ? `${share.toFixed(1)}%` : "—"}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border font-medium text-text-primary">
            <td className="py-2 pl-3 pr-4">Total</td>
            <td className="py-2 pr-4 text-right tabular-nums">{formatCurrency(total)}</td>
            <td className="py-2 pr-4 text-right tabular-nums">
              {total > 0 ? "100.0%" : "—"}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
