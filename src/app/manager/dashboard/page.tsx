"use client";

import { useRouter } from "next/navigation";
import {
  Wallet,
  Users,
  AlertCircle,
  Receipt,
  TrendingUp,
  UserPlus,
  ClipboardCheck,
  ClipboardList,
  Coins,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActionCenterCard, type ActionItem } from "@/components/dashboard/ActionCenterCard";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { RevenueTrendChart } from "@/components/dashboard/RevenueTrendChart";
import { RevenueByMethodChart } from "@/components/dashboard/RevenueByMethodChart";
import { ServiceCategoryChart } from "@/components/dashboard/ServiceCategoryChart";
import { useAuthStore } from "@/store/authStore";
import { useTodaySystemCollection } from "@/hooks/dailyClosing/useTodaySystemCollection";
import { useDailyClosingHistory } from "@/hooks/dailyClosing/useDailyClosingHistory";
import { useExpenseSummary } from "@/hooks/expenses/useExpenseSummary";
import { useTransactionsSummary } from "@/hooks/transactions/useTransactionsSummary";
import { useDuePaymentsSummary } from "@/hooks/duePayments/useDuePaymentsSummary";
import { usePatientDirectorySummary } from "@/hooks/patients/usePatientDirectorySummary";
import { useBranchDashboardMetrics } from "@/hooks/transactions/useBranchDashboardMetrics";
import { useRevenueTrend } from "@/hooks/transactions/useRevenueTrend";
import { useMonthlyRevenueByMethod } from "@/hooks/transactions/useMonthlyRevenueByMethod";
import { useRevenueByCategory } from "@/hooks/transactions/useRevenueByCategory";
import { todayDateString } from "@/lib/api/dailyClosings";
import { formatCurrency } from "@/utils/currency";

const CLOSING_STATUS_TONE = { matched: "success", over: "warning", short: "danger" } as const;

export default function ManagerDashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const branchId = user?.branchId ?? undefined;

  const { data: todayCollection } = useTodaySystemCollection(branchId);
  const { data: metrics } = useBranchDashboardMetrics(branchId);
  const { data: expenses } = useExpenseSummary(branchId);
  const { data: transactions } = useTransactionsSummary(branchId);
  const { data: dues } = useDuePaymentsSummary(branchId);
  const { data: patients } = usePatientDirectorySummary(branchId);
  const { data: closings } = useDailyClosingHistory(branchId);

  const { data: trend, isLoading: trendLoading } = useRevenueTrend(branchId, 7);
  const { data: byMethod, isLoading: byMethodLoading } = useMonthlyRevenueByMethod(branchId);
  const { data: byCategory, isLoading: byCategoryLoading } = useRevenueByCategory(branchId);

  const todaysClosing = closings?.find((closing) => closing.date === todayDateString());
  const pendingApprovals = expenses?.pendingCount ?? 0;
  const todayRevenue = (todayCollection?.total ?? 0) - (expenses?.todayTotal ?? 0);

  const actionItems: ActionItem[] = [
    {
      key: "daily-closing",
      label: "Daily Closing",
      value: todaysClosing ? "Submitted" : "Not submitted",
      hint: todaysClosing
        ? `Status: ${todaysClosing.status.toUpperCase()}`
        : "Tap to submit today's closing",
      icon: ClipboardCheck,
      tone: todaysClosing ? CLOSING_STATUS_TONE[todaysClosing.status] : "warning",
      onClick: () => router.push("/manager/daily-closing"),
    },
    {
      key: "pending-approvals",
      label: "Pending Expense Approvals",
      value: String(pendingApprovals),
      hint: pendingApprovals > 0 ? "Awaiting Admin review" : "All expenses cleared",
      icon: ClipboardList,
      tone: pendingApprovals > 0 ? "warning" : "primary",
      onClick: () => router.push("/manager/expenses"),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref="/manager/dashboard"
        breadcrumb={["Branch Manager", "Dashboard"]}
        title="Dashboard"
        subtitle="Overview of your branch's daily performance."
      />

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Today
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Today's Collection"
            value={formatCurrency(todayCollection?.total ?? 0)}
            icon={Wallet}
            tone="success"
          />
          <StatCard
            label="Today's Revenue"
            value={formatCurrency(todayRevenue)}
            icon={Coins}
            tone={todayRevenue >= 0 ? "success" : "danger"}
            hint="Collection minus expenses"
          />
          <StatCard
            label="Patients Seen Today"
            value={String(metrics?.todayPatientsSeen ?? 0)}
            icon={Users}
          />
          <StatCard
            label="Today's Expenses"
            value={formatCurrency(expenses?.todayTotal ?? 0)}
            icon={Receipt}
            tone="danger"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          This Month
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Monthly Revenue"
            value={formatCurrency(transactions?.monthCollected ?? 0)}
            icon={TrendingUp}
            tone="success"
          />
          <StatCard label="New Patients" value={String(patients?.intake ?? 0)} icon={UserPlus} />
          <StatCard
            label="Outstanding Due"
            value={formatCurrency(dues?.totalDue ?? 0)}
            icon={AlertCircle}
            tone="warning"
          />
          <StatCard
            label="Monthly Expenses"
            value={formatCurrency(expenses?.monthTotal ?? 0)}
            icon={Receipt}
            tone="danger"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Action Center
        </h2>
        <ActionCenterCard items={actionItems} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Analytics
        </h2>
        <div className="flex flex-col gap-4">
          <Card>
            <h3 className="text-sm font-medium text-text-secondary">
              Revenue Trend (Last 7 Days)
            </h3>
            <div className="mt-4">
              {trendLoading && <LoadingState label="Loading trend…" />}
              {!trendLoading && trend && <RevenueTrendChart data={trend} />}
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="text-sm font-medium text-text-secondary">
                Revenue by Payment Method (This Month)
              </h3>
              <div className="mt-4">
                {byMethodLoading && <LoadingState label="Loading…" />}
                {!byMethodLoading && (!byMethod || byMethod.length === 0) && (
                  <EmptyState label="No collections this month yet." />
                )}
                {!byMethodLoading && byMethod && byMethod.length > 0 && (
                  <RevenueByMethodChart data={byMethod} />
                )}
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-medium text-text-secondary">
                Revenue by Service Category (This Month)
              </h3>
              <div className="mt-4">
                {byCategoryLoading && <LoadingState label="Loading…" />}
                {!byCategoryLoading && (!byCategory || byCategory.length === 0) && (
                  <EmptyState label="No collections this month yet." />
                )}
                {!byCategoryLoading && byCategory && byCategory.length > 0 && (
                  <ServiceCategoryChart data={byCategory} />
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
