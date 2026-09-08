"use client";

import { formatCurrency } from "@/utils/currency";
import { humanizeField } from "@/utils/fields";
import type { BranchSummaryRow } from "@/lib/api/transactions";

/**
 * A revenue split — by payment method, or by service type — as a table.
 *
 * The share column is what a bar chart was doing before: it answers "how much
 * of the money came this way" without making the reader compare pixel widths,
 * and unlike a bar it can be copied, sorted by eye and exported.
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

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="py-2 pr-4 font-medium">{label}</th>
            <th className="py-2 pr-4 text-right font-medium">Amount</th>
            <th className="py-2 pr-4 text-right font-medium">Share</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-border last:border-0">
              <td className="py-2 pr-4 text-text-primary">{humanizeField(row.label)}</td>
              <td className="py-2 pr-4 text-right tabular-nums">
                {formatCurrency(row.amount)}
              </td>
              <td className="py-2 pr-4 text-right tabular-nums text-text-secondary">
                {total > 0 ? `${((row.amount / total) * 100).toFixed(1)}%` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border font-medium text-text-primary">
            <td className="py-2 pr-4">Total</td>
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
