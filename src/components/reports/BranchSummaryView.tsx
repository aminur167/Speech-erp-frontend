"use client";

import { useState } from "react";
import {
  Wallet,
  Receipt,
  TrendingUp,
  AlertCircle,
  Users,
  UserPlus,
  Undo2,
  ClipboardCheck,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/states";
import { FilterBar, FILTER_FIELD_WIDTH } from "@/components/ui/FilterBar";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { useBranchSummary } from "@/hooks/reports/useBranchSummary";
import { formatCurrency } from "@/utils/currency";
import { humanizeField } from "@/utils/fields";
import { toLocalDateString } from "@/utils/time";
import type { BranchSummaryRow } from "@/lib/api/transactions";

const isoDate = toLocalDateString;

function firstOfThisMonth(): string {
  const now = new Date();
  return isoDate(new Date(now.getFullYear(), now.getMonth(), 1));
}

/** Quick ranges, because typing two dates for "this month" is a chore. */
function presetRange(preset: "today" | "month" | "last30" | "year"): [string, string] {
  const now = new Date();
  const today = isoDate(now);
  switch (preset) {
    case "today":
      return [today, today];
    case "month":
      return [firstOfThisMonth(), today];
    case "last30": {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      return [isoDate(from), today];
    }
    case "year":
      return [isoDate(new Date(now.getFullYear(), 0, 1)), today];
  }
}

/** A labelled bar, sized against the largest row so proportions read at a glance. */
function BreakdownBars({ rows, empty }: { rows: BranchSummaryRow[]; empty: string }) {
  if (rows.length === 0) return <EmptyState label={empty} />;
  const max = Math.max(...rows.map((row) => row.amount), 1);

  return (
    <div className="mt-4 flex flex-col gap-3">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-text-primary">{humanizeField(row.label)}</span>
            <span className="font-medium text-text-primary">{formatCurrency(row.amount)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-background">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max((row.amount / max) * 100, 2)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * One branch's full picture over a chosen date range.
 *
 * Shared by the Manager's own Summary page and Admin's branch drill-down —
 * `branchId` is what distinguishes them, and the backend ignores it for a
 * Manager, so the same screen can't leak another branch either way.
 */
export function BranchSummaryView({
  homeHref,
  breadcrumb,
  branchId,
  subtitle,
}: {
  homeHref: string;
  breadcrumb: string[];
  /** Admin only — a Manager is scoped to their own branch server-side. */
  branchId?: string;
  subtitle: string;
}) {
  const [dateFrom, setDateFrom] = useState(firstOfThisMonth);
  const [dateTo, setDateTo] = useState(() => isoDate(new Date()));

  const { data, isLoading, isError, refetch } = useBranchSummary({
    branchId,
    dateFrom,
    dateTo,
  });

  const applyPreset = (preset: Parameters<typeof presetRange>[0]) => {
    const [from, to] = presetRange(preset);
    setDateFrom(from);
    setDateTo(to);
  };

  const today = isoDate(new Date());
  const rangeIsValid = dateFrom <= dateTo;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref={homeHref}
        breadcrumb={breadcrumb}
        title="Summary"
        subtitle={subtitle}
      />

      <FilterBar
        dateSlot={
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              aria-label="From date"
              value={dateFrom}
              max={today}
              onChange={(event) => setDateFrom(event.target.value)}
              containerClassName={FILTER_FIELD_WIDTH}
            />
            <span className="text-xs text-text-secondary">to</span>
            <Input
              type="date"
              aria-label="To date"
              value={dateTo}
              max={today}
              onChange={(event) => setDateTo(event.target.value)}
              containerClassName={FILTER_FIELD_WIDTH}
            />
          </div>
        }
      >
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["today", "Today"],
              ["month", "This month"],
              ["last30", "Last 30 days"],
              ["year", "This year"],
            ] as const
          ).map(([preset, label]) => (
            <Button key={preset} variant="secondary" onClick={() => applyPreset(preset)}>
              {label}
            </Button>
          ))}
        </div>
      </FilterBar>

      {!rangeIsValid && (
        <Card>
          <p className="text-sm text-danger">
            The start date is after the end date — pick a range that runs forwards.
          </p>
        </Card>
      )}

      {rangeIsValid && isLoading && <LoadingState label="Loading summary…" />}
      {rangeIsValid && isError && <ErrorState onRetry={() => refetch()} />}

      {rangeIsValid && !isLoading && !isError && data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Collected"
              value={formatCurrency(data.grossCollected)}
              icon={Wallet}
              tone="success"
            />
            <StatCard
              label="Expenses"
              value={formatCurrency(data.expenses)}
              icon={Receipt}
              tone="danger"
            />
            <StatCard
              label="Net Revenue"
              value={formatCurrency(data.netRevenue)}
              icon={TrendingUp}
              tone={data.netRevenue >= 0 ? "success" : "danger"}
            />
            <StatCard
              label="Outstanding Due (now)"
              value={formatCurrency(data.outstandingDue)}
              icon={AlertCircle}
              tone="warning"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Payments Taken"
              value={String(data.paymentCount)}
              icon={Receipt}
            />
            <StatCard label="Patients Seen" value={String(data.patientsSeen)} icon={Users} />
            <StatCard
              label="New Patients"
              value={String(data.newPatients)}
              icon={UserPlus}
            />
            <StatCard
              label="Refunds"
              value={`${data.refundCount} · ${formatCurrency(data.refunded)}`}
              icon={Undo2}
              tone={data.refundCount > 0 ? "warning" : undefined}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="text-sm font-medium text-text-secondary">
                Collection by Payment Method
              </h2>
              <BreakdownBars
                rows={data.byMethod}
                empty="Nothing collected in this range."
              />
            </Card>

            <Card>
              <h2 className="text-sm font-medium text-text-secondary">
                Revenue by Service Type
              </h2>
              <BreakdownBars
                rows={data.byCategory}
                empty="No service revenue in this range."
              />
            </Card>
          </div>

          <Card>
            <h2 className="text-sm font-medium text-text-secondary">Daily Closing</h2>
            <div className="mt-3 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-text-secondary" />
                <div>
                  <p className="text-2xl font-semibold text-text-primary">
                    {data.closingsSubmitted}
                  </p>
                  <p className="text-xs text-text-secondary">Submitted in range</p>
                </div>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <p
                  className={
                    data.closingsMismatched > 0
                      ? "text-2xl font-semibold text-danger"
                      : "text-2xl font-semibold text-success"
                  }
                >
                  {data.closingsMismatched}
                </p>
                <p className="text-xs text-text-secondary">Cash mismatches</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <p className="text-2xl font-semibold text-text-primary">
                  {data.expenseCount}
                </p>
                <p className="text-xs text-text-secondary">Expense vouchers</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <p className="text-2xl font-semibold text-text-primary">
                  {data.totalPatients}
                </p>
                <p className="text-xs text-text-secondary">Patients on file (total)</p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
