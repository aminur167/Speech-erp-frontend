"use client";

import Link from "next/link";
import {
  Building2,
  Users,
  CalendarCheck,
  Wallet,
  TrendingUp,
  UserPlus,
  AlertCircle,
  Receipt,
  ClipboardList,
  ChevronRight,
  BarChart3,
  History,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard, toneAccentColor } from "@/components/dashboard/StatCard";
import { TrendFooter } from "@/components/dashboard/TrendFooter";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { RevenueTrendChart } from "@/components/dashboard/RevenueTrendChart";
import { RevenueByMethodChart } from "@/components/dashboard/RevenueByMethodChart";
import { ServiceCategoryChart } from "@/components/dashboard/ServiceCategoryChart";
import { useTodaySystemCollection } from "@/hooks/dailyClosing/useTodaySystemCollection";
import { useExpenseSummary } from "@/hooks/expenses/useExpenseSummary";
import { useTransactionsSummary } from "@/hooks/transactions/useTransactionsSummary";
import { useDuePaymentsSummary } from "@/hooks/duePayments/useDuePaymentsSummary";
import { usePatientDirectorySummary } from "@/hooks/patients/usePatientDirectorySummary";
import { useBranchDashboardMetrics } from "@/hooks/transactions/useBranchDashboardMetrics";
import { useRevenueTrend } from "@/hooks/transactions/useRevenueTrend";
import { useMonthlyRevenueByMethod } from "@/hooks/transactions/useMonthlyRevenueByMethod";
import { useRevenueByCategory } from "@/hooks/transactions/useRevenueByCategory";
import { useBranchesOverview } from "@/hooks/branches/useBranchesOverview";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/currency";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const QUICK_ACTIONS = [
  {
    href: "/admin/branches",
    label: "Manage Branches",
    hint: "Add or edit locations",
    icon: Building2,
    tone: "primary" as const,
  },
  {
    href: "/admin/expenses",
    label: "Review Expenses",
    hint: "Approve or reject vouchers",
    icon: ClipboardList,
    tone: "warning" as const,
  },
  {
    href: "/admin/transactions",
    label: "View Transactions",
    hint: "Every payment, all branches",
    icon: History,
    tone: "info" as const,
  },
  {
    href: "/admin/reports",
    label: "View Reports",
    hint: "Deeper performance analysis",
    icon: BarChart3,
    tone: "purple" as const,
  },
];

export default function AdminDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { data: overview, isLoading: branchesLoading } = useBranchesOverview();
  const { data: todayCollection } = useTodaySystemCollection();
  const { data: metrics } = useBranchDashboardMetrics();
  const { data: expenses } = useExpenseSummary();
  const { data: transactions } = useTransactionsSummary();
  const { data: dues } = useDuePaymentsSummary();
  const { data: patients } = usePatientDirectorySummary();

  const { data: trend, isLoading: trendLoading } = useRevenueTrend(undefined, 7);
  const { data: byMethod, isLoading: byMethodLoading } = useMonthlyRevenueByMethod();
  const { data: byCategory, isLoading: byCategoryLoading } = useRevenueByCategory();

  const branches = overview ?? [];
  const activeBranches = branches.filter((item) => item.branch.status === "active").length;
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
  const newBranchesThisMonth = branches.filter((item) => {
    const opened = new Date(item.branch.openedAt);
    return `${opened.getFullYear()}-${opened.getMonth()}` === monthKey;
  }).length;

  const topBranches = [...branches].sort((a, b) => b.monthlyRevenue - a.monthlyRevenue).slice(0, 5);
  const maxBranchRevenue = Math.max(...topBranches.map((item) => item.monthlyRevenue), 1);

  const todayDateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref="/admin/dashboard"
        breadcrumb={["Admin", "Dashboard"]}
        title={`${getGreeting()}, ${user?.name ?? "Admin"}`}
        subtitle={`${todayDateLabel} · Real-time overview across all branches`}
        action={
          <div className="flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            Live
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{
                backgroundColor: `${toneAccentColor[action.tone]}1a`,
                color: toneAccentColor[action.tone],
              }}
            >
              <action.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">{action.label}</p>
              <p className="truncate text-xs text-text-secondary">{action.hint}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Branches"
          value={String(branches.length)}
          icon={Building2}
          footer={
            newBranchesThisMonth > 0 ? (
              <TrendFooter
                trend={`+${newBranchesThisMonth} this month`}
                context={`${activeBranches} active`}
              />
            ) : (
              <p className="text-xs text-text-secondary">{activeBranches} active</p>
            )
          }
        />
        <StatCard
          label="Total Patients"
          value={String(patients?.total ?? 0)}
          icon={Users}
          footer={
            <TrendFooter
              trend={`+${patients?.intake ?? 0} this month`}
              context="Across all branches"
            />
          }
        />
        <StatCard
          label="Today's Sessions"
          value={String(metrics?.todayPatientsSeen ?? 0)}
          icon={CalendarCheck}
          hint="All branches combined"
        />
        <StatCard
          label="Today's Revenue"
          value={formatCurrency(todayCollection?.total ?? 0)}
          icon={Wallet}
          tone="success"
          chart={
            trend && trend.length > 1 ? (
              <Sparkline data={trend.map((point) => point.amount)} color={toneAccentColor.success} />
            ) : undefined
          }
          footer={<TrendFooter trend="Live" context="Real-time from all branches" />}
        />
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

      {(expenses?.pendingCount ?? 0) > 0 && (
        <Card className="flex items-center justify-between gap-4 border-l-4 border-l-warning">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-warning/10 p-2 text-warning">
              <ClipboardList className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">
                {expenses?.pendingCount} expense{expenses?.pendingCount === 1 ? "" : "s"} awaiting
                your approval
              </p>
              <p className="text-xs text-text-secondary">Submitted by branch managers</p>
            </div>
          </div>
          <Link
            href="/admin/expenses"
            className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Review
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Branch Performance
          </h2>
          <Link
            href="/admin/branches"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View all
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <Card>
          {branchesLoading && <LoadingState label="Loading branches…" />}
          {!branchesLoading && topBranches.length === 0 && (
            <EmptyState label="No branches configured yet." />
          )}
          {!branchesLoading && topBranches.length > 0 && (
            <div className="flex flex-col divide-y divide-border">
              {topBranches.map((item) => {
                const share = Math.round((item.monthlyRevenue / maxBranchRevenue) * 100);
                return (
                  <div key={item.branch.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-text-primary">
                            {item.branch.name}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {item.patientCount} patients
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Badge
                          tone={item.branch.status === "active" ? "success" : "warning"}
                          label={item.branch.status === "active" ? "Active" : "Inactive"}
                        />
                        <span className="w-24 text-right text-sm font-semibold text-text-primary">
                          {formatCurrency(item.monthlyRevenue)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-background">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.max(share, item.monthlyRevenue > 0 ? 3 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
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
