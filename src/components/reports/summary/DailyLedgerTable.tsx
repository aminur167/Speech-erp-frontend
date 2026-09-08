"use client";

import { Badge } from "@/components/ui/Badge";
import { RowDetailDrawer, useRowDetail } from "@/components/ui/RowDetailDrawer";
import { formatCurrency } from "@/utils/currency";
import type { DailyLedgerRow } from "@/lib/api/transactions";

/**
 * The branch ledger, one row per day.
 *
 * The totals row is the point of the table as much as the days are: a manager
 * reading a range wants both "what happened on the 12th" and "what the range
 * came to", and reading the second off a column of numbers by eye is how
 * people mis-report a month. It sums every row in the range, not just the
 * page on screen — a per-page subtotal labelled "Total" would be worse than
 * no total at all.
 */
export function DailyLedgerTable({
  rows,
  totalsFor,
}: {
  /** The page being shown. */
  rows: DailyLedgerRow[];
  /** Every row in the range, which is what the footer totals. */
  totalsFor: DailyLedgerRow[];
}) {
  const detail = useRowDetail<DailyLedgerRow>();
  const sum = (pick: (row: DailyLedgerRow) => number) =>
    totalsFor.reduce((running, row) => running + pick(row), 0);

  const totalNet = sum((row) => row.netRevenue);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="py-2 pr-4 font-medium">Date</th>
            <th className="py-2 pr-4 text-right font-medium">Invoices</th>
            <th className="py-2 pr-4 text-right font-medium">Patients</th>
            <th className="py-2 pr-4 text-right font-medium">Collected</th>
            <th className="py-2 pr-4 text-right font-medium">Refunds</th>
            <th className="py-2 pr-4 text-right font-medium">Expenses</th>
            <th className="py-2 pr-4 text-right font-medium">Net</th>
            <th className="py-2 pr-4 font-medium">Closing</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.date} {...detail.rowProps(row)}>
              <td className="whitespace-nowrap py-2 pr-4 font-medium text-text-primary">
                {row.date}
              </td>
              <td className="py-2 pr-4 text-right tabular-nums">{row.transactionCount}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{row.patientsSeen}</td>
              <td className="py-2 pr-4 text-right tabular-nums">
                {formatCurrency(row.collected)}
              </td>
              <td className="py-2 pr-4 text-right tabular-nums text-text-secondary">
                {row.refunded > 0 ? formatCurrency(row.refunded) : "—"}
              </td>
              <td className="py-2 pr-4 text-right tabular-nums text-text-secondary">
                {row.expenses > 0 ? formatCurrency(row.expenses) : "—"}
              </td>
              <td
                className={
                  row.netRevenue < 0
                    ? "py-2 pr-4 text-right font-medium tabular-nums text-danger"
                    : "py-2 pr-4 text-right font-medium tabular-nums text-text-primary"
                }
              >
                {formatCurrency(row.netRevenue)}
              </td>
              <td className="py-2 pr-4">
                {row.closingStatus === "matched" && <Badge tone="success" label="Matched" />}
                {row.closingStatus === "mismatched" && (
                  <Badge
                    tone="danger"
                    label={`Off by ${formatCurrency(Math.abs(row.closingDifference))}`}
                  />
                )}
                {row.closingStatus === "" && (
                  <span className="text-xs text-text-secondary">Not closed</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border font-medium text-text-primary">
            <td className="py-2 pr-4">Total ({totalsFor.length} days)</td>
            <td className="py-2 pr-4 text-right tabular-nums">
              {sum((row) => row.transactionCount)}
            </td>
            <td className="py-2 pr-4 text-right tabular-nums text-text-secondary">—</td>
            <td className="py-2 pr-4 text-right tabular-nums">
              {formatCurrency(sum((row) => row.collected))}
            </td>
            <td className="py-2 pr-4 text-right tabular-nums">
              {formatCurrency(sum((row) => row.refunded))}
            </td>
            <td className="py-2 pr-4 text-right tabular-nums">
              {formatCurrency(sum((row) => row.expenses))}
            </td>
            <td
              className={
                totalNet < 0
                  ? "py-2 pr-4 text-right tabular-nums text-danger"
                  : "py-2 pr-4 text-right tabular-nums text-success"
              }
            >
              {formatCurrency(totalNet)}
            </td>
            <td className="py-2 pr-4" />
          </tr>
        </tfoot>
      </table>

      <RowDetailDrawer
        open={detail.isOpen}
        onClose={detail.close}
        title={detail.selected?.date ?? ""}
        subtitle="Day summary"
        data={detail.selected}
      />
    </div>
  );
}
