"use client";

import { Badge } from "@/components/ui/Badge";
import { RowDetailDrawer, useRowDetail } from "@/components/ui/RowDetailDrawer";
import { SortHeader, useTableSort } from "@/components/ui/SortableTable";
import { formatCurrency } from "@/utils/currency";
import type { DailyLedgerRow } from "@/lib/api/transactions";

/**
 * The branch ledger, one row per day.
 *
 * The totals row is the point of the table as much as the days are: a
 * manager reading a range wants both "what happened on the 12th" and "what
 * the range came to", and reading the second off a column of numbers by eye
 * is how people mis-report a month. It sums every row in the range, not just
 * the page on screen — a per-page subtotal labelled "Total" would be worse
 * than no total at all — and it sticks to the bottom of the table so it
 * stays readable while scrolling through a long month.
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
  const { sorted, sort, toggle } = useTableSort(rows, { key: "date", direction: "desc" });

  const sum = (pick: (row: DailyLedgerRow) => number) =>
    totalsFor.reduce((running, row) => running + pick(row), 0);
  const totalNet = sum((row) => row.netRevenue);

  // Scales the in-cell bars. Taken from the whole range rather than the page
  // so a quiet page doesn't make its busiest day look like a record one.
  const peak = Math.max(...totalsFor.map((row) => Math.abs(row.netRevenue)), 1);

  return (
    <div className="max-h-[32rem] overflow-auto rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <SortHeader<DailyLedgerRow>
              label="Date" columnKey="date" sort={sort} onSort={toggle} sticky className="pl-3"
            />
            <SortHeader<DailyLedgerRow>
              label="Invoices" columnKey="transactionCount" sort={sort} onSort={toggle} sticky align="right"
            />
            <SortHeader<DailyLedgerRow>
              label="Patients" columnKey="patientsSeen" sort={sort} onSort={toggle} sticky align="right"
            />
            <SortHeader<DailyLedgerRow>
              label="Collected" columnKey="collected" sort={sort} onSort={toggle} sticky align="right"
            />
            <SortHeader<DailyLedgerRow>
              label="Refunds" columnKey="refunded" sort={sort} onSort={toggle} sticky align="right"
            />
            <SortHeader<DailyLedgerRow>
              label="Expenses" columnKey="expenses" sort={sort} onSort={toggle} sticky align="right"
            />
            <SortHeader<DailyLedgerRow>
              label="Net" columnKey="netRevenue" sort={sort} onSort={toggle} sticky align="right"
            />
            <th scope="col" className="sticky top-0 z-10 bg-surface py-2 pr-4 font-medium">
              Closing
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.date} {...detail.rowProps(row)}>
              <td className="whitespace-nowrap py-2 pl-3 pr-4 font-medium text-text-primary">
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
              <td className="relative py-2 pr-4 text-right">
                {/* A bar behind the figure, scaled across the range: it turns
                    a column of similar-looking numbers into a shape the eye
                    can scan for the outlier day. */}
                <span
                  aria-hidden
                  className={
                    row.netRevenue < 0
                      ? "absolute inset-y-1 right-4 rounded-sm bg-danger/10"
                      : "absolute inset-y-1 right-4 rounded-sm bg-success/10"
                  }
                  style={{ width: `${Math.max((Math.abs(row.netRevenue) / peak) * 100, 2)}%` }}
                />
                <span
                  className={
                    row.netRevenue < 0
                      ? "relative font-medium tabular-nums text-danger"
                      : "relative font-medium tabular-nums text-text-primary"
                  }
                >
                  {formatCurrency(row.netRevenue)}
                </span>
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
          <tr className="sticky bottom-0 border-t-2 border-border bg-surface font-medium text-text-primary">
            <td className="py-2 pl-3 pr-4">Total ({totalsFor.length} days)</td>
            <td className="py-2 pr-4 text-right tabular-nums">
              {sum((row) => row.transactionCount)}
            </td>
            <td
              className="py-2 pr-4 text-right tabular-nums text-text-secondary"
              title="Not summed: the same patient seen on two days is one patient, not two."
            >
              —
            </td>
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
