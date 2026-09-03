"use client";

import { useState } from "react";
import { Wallet, Receipt, TrendingUp, AlertCircle, Users, HeartPulse, Activity, ClipboardList } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { BranchFilterSelect } from "@/components/ui/BranchFilterSelect";
import { FilterBar, FILTER_FIELD_WIDTH } from "@/components/ui/FilterBar";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { BarRow } from "@/components/reports/BarRow";
import { useTransactionsSummary } from "@/hooks/transactions/useTransactionsSummary";
import { useCollectionForDate } from "@/hooks/transactions/useCollectionForDate";
import { useExpenseSummary } from "@/hooks/expenses/useExpenseSummary";
import { useExpenseTotalForDate } from "@/hooks/expenses/useExpenseTotalForDate";
import { useDuePaymentsSummary } from "@/hooks/duePayments/useDuePaymentsSummary";
import { usePatientDirectorySummary } from "@/hooks/patients/usePatientDirectorySummary";
import { useDailyClosingHistory } from "@/hooks/dailyClosing/useDailyClosingHistory";
import { useRefundsAndVoids } from "@/hooks/transactions/useRefundsAndVoids";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { RowDetailDrawer, useRowDetail } from "@/components/ui/RowDetailDrawer";
import { formatCurrency } from "@/utils/currency";
import type { SummaryPeriod } from "@/lib/api/transactions";

const PERIOD_LABEL: Record<SummaryPeriod, string> = {
  "": "All time",
  today: "Today",
  month: "This month",
};

export function AdminReportsView() {
  const [branchId, setBranchId] = useState("");
  const [period, setPeriod] = useState<SummaryPeriod>("");
  const [date, setDate] = useState("");
  const scopedBranchId = branchId || undefined;

  const { data: transactions } = useTransactionsSummary(scopedBranchId);
  const { data: expenses } = useExpenseSummary(scopedBranchId);
  const { data: dateCollected } = useCollectionForDate(scopedBranchId, date);
  const { data: dateExpenses } = useExpenseTotalForDate(scopedBranchId, date);
  const { data: dues } = useDuePaymentsSummary(scopedBranchId);
  const { data: patients } = usePatientDirectorySummary(scopedBranchId);
  const { data: closings, isLoading: closingsLoading } = useDailyClosingHistory(scopedBranchId);
  const { data: refundsAndVoids, isLoading: refundsLoading } = useRefundsAndVoids(scopedBranchId);

  const periodLabel = date
    ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : PERIOD_LABEL[period];

  const totalCollected = date
    ? (dateCollected ?? 0)
    : period === "today"
      ? (transactions?.todayCollected ?? 0)
      : period === "month"
        ? (transactions?.monthCollected ?? 0)
        : (transactions?.totalCollected ?? 0);
  const totalExpenses = date
    ? (dateExpenses ?? 0)
    : period === "today"
      ? (expenses?.todayTotal ?? 0)
      : period === "month"
        ? (expenses?.monthTotal ?? 0)
        : (expenses?.total ?? 0);
  const netRevenue = totalCollected - totalExpenses;
  const mismatches = closings?.filter((closing) => closing.status !== "matched") ?? [];
  const maxMethodAmount = transactions?.byMethod[0]?.amount ?? 0;
  const mismatchDetail = useRowDetail<(typeof mismatches)[number]>();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref="/admin/dashboard"
        breadcrumb={["Admin", "Reports"]}
        title="Reports"
        subtitle="Revenue, service and payment-type reports across the organization."
      />

      <FilterBar
        dateSlot={
          <Input
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setPeriod("");
            }}
            containerClassName={FILTER_FIELD_WIDTH}
            max={new Date().toISOString().slice(0, 10)}
          />
        }
      >
        <BranchFilterSelect value={branchId} onChange={setBranchId} />
        <Select
          value={period}
          onChange={(event) => {
            setPeriod(event.target.value as SummaryPeriod);
            setDate("");
          }}
          containerClassName={FILTER_FIELD_WIDTH}
        >
          <option value="">All time</option>
          <option value="today">Today</option>
          <option value="month">This month</option>
        </Select>
      </FilterBar>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={`Total Collected (${periodLabel})`}
          value={formatCurrency(totalCollected)}
          icon={Wallet}
          tone="success"
        />
        <StatCard
          label={`Total Expenses (${periodLabel})`}
          value={formatCurrency(totalExpenses)}
          icon={Receipt}
          tone="danger"
        />
        <StatCard
          label="Net Revenue"
          value={formatCurrency(netRevenue)}
          icon={TrendingUp}
          tone={netRevenue >= 0 ? "success" : "danger"}
        />
        <StatCard
          label="Outstanding Due"
          value={formatCurrency(dues?.totalDue ?? 0)}
          icon={AlertCircle}
          tone="warning"
        />
      </div>

      <Card>
        <h2 className="text-sm font-medium text-text-secondary">
          Revenue by Payment Method
        </h2>
        <div className="mt-4 flex flex-col gap-4">
          {!transactions || transactions.byMethod.length === 0 ? (
            <EmptyState label="No collected payments yet." />
          ) : (
            transactions.byMethod.map((entry) => (
              <BarRow
                key={entry.method}
                label={entry.method.replace("_", " ")}
                amount={entry.amount}
                maxAmount={maxMethodAmount}
              />
            ))
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Patients" value={String(patients?.total ?? 0)} icon={Users} />
        <StatCard
          label="Active Care"
          value={String(patients?.activeCare ?? 0)}
          icon={HeartPulse}
          tone="success"
        />
        <StatCard
          label="In Progress"
          value={String(patients?.inProgress ?? 0)}
          icon={Activity}
          tone="purple"
        />
        <StatCard
          label="Action Needed"
          value={String(patients?.actionNeeded ?? 0)}
          icon={ClipboardList}
          tone="warning"
        />
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-text-secondary">
            Daily Closing Mismatches
          </h2>
          <Badge
            tone={mismatches.length > 0 ? "danger" : "success"}
            label={`${mismatches.length} found`}
          />
        </div>
        <div className="mt-3">
          {closingsLoading && <LoadingState label="Loading closings…" />}
          {!closingsLoading && mismatches.length === 0 && (
            <EmptyState label="No mismatches — every closing has matched so far." />
          )}
          {!closingsLoading && mismatches.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-text-secondary">
                    <th className="py-2 pr-4 font-medium">Date</th>
                    <th className="py-2 pr-4 font-medium">Branch</th>
                    <th className="py-2 pr-4 font-medium">System Total</th>
                    <th className="py-2 pr-4 font-medium">Actual Total</th>
                    <th className="py-2 pr-4 font-medium">Difference</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mismatches.map((closing) => (
                    <tr key={closing.id} {...mismatchDetail.rowProps(closing)}>
                      <td className="py-2 pr-4">{closing.date}</td>
                      <td className="py-2 pr-4">{closing.branchId}</td>
                      <td className="py-2 pr-4">{formatCurrency(closing.systemTotal)}</td>
                      <td className="py-2 pr-4">{formatCurrency(closing.actualTotal)}</td>
                      <td className="py-2 pr-4">{formatCurrency(closing.difference)}</td>
                      <td className="py-2 pr-4">
                        <Badge
                          tone={closing.status === "over" ? "warning" : "danger"}
                          label={closing.status.toUpperCase()}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-text-secondary">Refunds &amp; Voids</h2>
          <Badge
            tone={(refundsAndVoids?.length ?? 0) > 0 ? "warning" : "success"}
            label={`${refundsAndVoids?.length ?? 0} found`}
          />
        </div>
        <div className="mt-3">
          {refundsLoading && <LoadingState label="Loading refunds & voids…" />}
          {!refundsLoading && (!refundsAndVoids || refundsAndVoids.length === 0) && (
            <EmptyState label="No refunded or voided payments." />
          )}
          {!refundsLoading && refundsAndVoids && refundsAndVoids.length > 0 && (
            <TransactionTable transactions={refundsAndVoids} />
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-medium text-text-secondary">Expense Approvals</h2>
        <div className="mt-3 flex items-center gap-6">
          <div>
            <p className="text-2xl font-semibold text-text-primary">
              {expenses?.voucherCount ?? 0}
            </p>
            <p className="text-xs text-text-secondary">Vouchers recorded</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div>
            <p className="text-2xl font-semibold text-warning">{expenses?.pendingCount ?? 0}</p>
            <p className="text-xs text-text-secondary">Pending Admin approval</p>
          </div>
        </div>
      </Card>

      <RowDetailDrawer
        open={mismatchDetail.isOpen}
        onClose={mismatchDetail.close}
        title={mismatchDetail.selected ? `Closing · ${mismatchDetail.selected.date}` : ""}
        subtitle={mismatchDetail.selected?.status.toUpperCase()}
        data={mismatchDetail.selected}
        hiddenFields={["amendments"]}
      />
    </div>
  );
}
