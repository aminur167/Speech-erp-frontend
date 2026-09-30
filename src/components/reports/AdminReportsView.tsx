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
import { useRefundsAndVoids } from "@/hooks/transactions/useRefundsAndVoids";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { toLocalDateString } from "@/utils/time";
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
  const maxMethodAmount = transactions?.byMethod[0]?.amount ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
      />

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

      <FilterBar
        dateSlot={
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setPeriod("");
            }}
            containerClassName={FILTER_FIELD_WIDTH}
            max={toLocalDateString()}
          />
        }
      >
        <BranchFilterSelect value={branchId} onChange={setBranchId} />
        <Select
          label="Period"
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
    </div>
  );
}
