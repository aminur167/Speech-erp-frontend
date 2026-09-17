"use client";

import { Badge } from "@/components/ui/Badge";
import { RowDetailDrawer, useRowDetail } from "@/components/ui/RowDetailDrawer";
import { formatCurrency } from "@/utils/currency";
import type { ActivityRow, ActivityType } from "@/lib/api/transactions";

type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "purple";

const TYPE_META: Record<ActivityType, { label: string; tone: Tone }> = {
  invoice: { label: "Invoice", tone: "info" },
  expense: { label: "Expense", tone: "warning" },
  refund: { label: "Refund", tone: "purple" },
  patient: { label: "New Patient", tone: "success" },
  enrollment: { label: "Enrollment", tone: "success" },
  salary: { label: "Salary", tone: "neutral" },
};

// Spans several different status vocabularies (payment/expense/refund plus
// the non-money patient/enrollment/salary events) at once — a plain string
// keyed lookup with a neutral fallback rather than a badge component per
// event type for what the manager reads as one column.
const STATUS_TONE: Record<string, Tone> = {
  paid: "success",
  approved: "success",
  registered: "success",
  enrolled: "success",
  requested: "warning",
  due: "warning",
  pending: "warning",
  partial: "warning",
  upcoming: "neutral",
  cancelled: "neutral",
  refunded: "purple",
  void: "danger",
  rejected: "danger",
};

/**
 * Every invoice, expense, refund, new patient, service enrollment and
 * salary-payment decision in the range, newest first, in one table — what a
 * manager scans instead of flipping between half a dozen separate screens
 * to see everything that happened.
 *
 * `startIndex` numbers rows against the whole range rather than restarting
 * at 1 on every page, so "#42" means the same row no matter which page of
 * the range it's read from.
 */
export function ActivityLedgerTable({
  rows,
  startIndex,
  totalsFor,
}: {
  /** The page being shown. */
  rows: ActivityRow[];
  startIndex: number;
  /** Every row in the range, which is what the footer totals. */
  totalsFor: ActivityRow[];
}) {
  const detail = useRowDetail<ActivityRow>();

  const totalIn = totalsFor
    .filter((row) => row.direction === "in")
    .reduce((sum, row) => sum + row.amount, 0);
  const totalOut = totalsFor
    .filter((row) => row.direction === "out")
    .reduce((sum, row) => sum + row.amount, 0);
  const net = totalIn - totalOut;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="py-2 pl-3 pr-2 font-medium">#</th>
            <th className="py-2 pr-4 font-medium">Date &amp; Time</th>
            <th className="py-2 pr-4 font-medium">Type</th>
            <th className="py-2 pr-4 font-medium">Details</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 pr-4 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const type = TYPE_META[row.type];
            return (
              <tr key={row.id} {...detail.rowProps(row)}>
                <td className="py-2 pl-3 pr-2 tabular-nums text-text-secondary">
                  {startIndex + index + 1}
                </td>
                <td className="whitespace-nowrap py-2 pr-4">
                  {new Date(row.occurredAt).toLocaleString()}
                </td>
                <td className="py-2 pr-4">
                  <Badge tone={type.tone} label={type.label} />
                </td>
                <td className="max-w-[280px] py-2 pr-4">
                  <p className="truncate font-medium text-text-primary" title={row.description}>
                    {row.description || type.label}
                  </p>
                  <p className="truncate text-xs text-text-secondary">
                    {row.person}
                    {row.person && " · "}
                    <span className="font-mono">{row.reference}</span>
                    {row.performedBy && ` · ${row.performedBy}`}
                  </p>
                </td>
                <td className="py-2 pr-4">
                  <Badge tone={STATUS_TONE[row.status] ?? "neutral"} label={row.status} />
                </td>
                {row.direction === "neutral" ? (
                  <td className="py-2 pr-4 text-right tabular-nums text-text-secondary">
                    {row.amount > 0 ? formatCurrency(row.amount) : "—"}
                  </td>
                ) : (
                  <td
                    className={
                      row.direction === "in"
                        ? "py-2 pr-4 text-right font-medium tabular-nums text-success"
                        : "py-2 pr-4 text-right font-medium tabular-nums text-danger"
                    }
                  >
                    {row.direction === "in" ? "+" : "−"}
                    {formatCurrency(row.amount)}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="sticky bottom-0 border-t-2 border-border bg-surface font-medium text-text-primary">
            <td className="py-2 pl-3 pr-2" colSpan={4}>
              Total ({totalsFor.length} {totalsFor.length === 1 ? "entry" : "entries"})
            </td>
            <td className="py-2 pr-4 text-right text-text-secondary">
              +{formatCurrency(totalIn)} / −{formatCurrency(totalOut)}
            </td>
            <td
              className={
                net < 0
                  ? "py-2 pr-4 text-right tabular-nums text-danger"
                  : "py-2 pr-4 text-right tabular-nums text-success"
              }
            >
              {formatCurrency(net)}
            </td>
          </tr>
        </tfoot>
      </table>

      <RowDetailDrawer
        open={detail.isOpen}
        onClose={detail.close}
        title={detail.selected?.reference ?? ""}
        subtitle={detail.selected ? TYPE_META[detail.selected.type].label : undefined}
        data={detail.selected}
      />
    </div>
  );
}
