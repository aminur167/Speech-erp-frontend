"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Phone,
  Calendar,
  KeyRound,
  Pencil,
  Wallet,
  Users,
  ClipboardCheck,
  Receipt,
  TrendingUp,
  UserPlus,
  AlertCircle,
  Boxes,
  AlertTriangle,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatCard } from "@/components/dashboard/StatCard";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { RevenueTrendChart } from "@/components/dashboard/RevenueTrendChart";
import { RevenueByMethodChart } from "@/components/dashboard/RevenueByMethodChart";
import { ServiceCategoryChart } from "@/components/dashboard/ServiceCategoryChart";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { BranchForm } from "@/components/branches/BranchForm";
import { useBranchOverview } from "@/hooks/branches/useBranchOverview";
import { useUpdateBranch } from "@/hooks/branches/useUpdateBranch";
import { useTodaySystemCollection } from "@/hooks/dailyClosing/useTodaySystemCollection";
import { useBranchDashboardMetrics } from "@/hooks/transactions/useBranchDashboardMetrics";
import { useExpenseSummary } from "@/hooks/expenses/useExpenseSummary";
import { useTransactionsSummary } from "@/hooks/transactions/useTransactionsSummary";
import { useDuePaymentsSummary } from "@/hooks/duePayments/useDuePaymentsSummary";
import { usePatientDirectorySummary } from "@/hooks/patients/usePatientDirectorySummary";
import { useMaterialsSummary } from "@/hooks/materials/useMaterialsSummary";
import { useRevenueTrend } from "@/hooks/transactions/useRevenueTrend";
import { useMonthlyRevenueByMethod } from "@/hooks/transactions/useMonthlyRevenueByMethod";
import { useRevenueByCategory } from "@/hooks/transactions/useRevenueByCategory";
import { useTransactions } from "@/hooks/transactions/useTransactions";
import { formatCurrency } from "@/utils/currency";
import type { BranchInput } from "@/lib/api/branches";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function BranchDetailView({ branchId }: { branchId: string }) {
  const { data: overview, isLoading, isError } = useBranchOverview(branchId);
  const updateBranch = useUpdateBranch();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: todayCollection } = useTodaySystemCollection(branchId);
  const { data: metrics } = useBranchDashboardMetrics(branchId);
  const { data: expenses } = useExpenseSummary(branchId);
  const { data: transactions } = useTransactionsSummary(branchId);
  const { data: dues } = useDuePaymentsSummary(branchId);
  const { data: patients } = usePatientDirectorySummary(branchId);
  const { data: materials } = useMaterialsSummary(branchId);
  const { data: recent, isLoading: recentLoading } = useTransactions({
    branchId,
    page: 1,
    pageSize: 8,
  });

  const { data: trend, isLoading: trendLoading } = useRevenueTrend(branchId, 7);
  const { data: byMethod, isLoading: byMethodLoading } = useMonthlyRevenueByMethod(branchId);
  const { data: byCategory, isLoading: byCategoryLoading } = useRevenueByCategory(branchId);

  const handleUpdate = (input: BranchInput) => {
    updateBranch.mutate({ id: branchId, input }, { onSuccess: () => setIsEditOpen(false) });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          homeHref="/admin/dashboard"
          breadcrumb={["Admin", "Branches", "…"]}
          title="Loading branch…"
        />
        <Card>
          <LoadingState label="Loading branch details…" />
        </Card>
      </div>
    );
  }

  if (isError || !overview) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader homeHref="/admin/dashboard" breadcrumb={["Admin", "Branches"]} title="Branch not found" />
        <Card>
          <EmptyState label="This branch doesn't exist or was removed." />
          <div className="mt-4">
            <Link href="/admin/branches" className="text-sm font-medium text-primary hover:underline">
              ← Back to Branches
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const { branch } = overview;
  const isActive = branch.status === "active";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        homeHref="/admin/dashboard"
        breadcrumb={["Admin", "Branches", branch.name]}
        title={branch.name}
        subtitle={`${branch.code} · Live, real-time view of this branch`}
        action={
          <div className="flex items-center gap-2">
            <Badge tone={isActive ? "success" : "warning"} label={isActive ? "Active" : "Inactive"} />
            <Button variant="secondary" onClick={() => setIsEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-text-primary">{branch.managerName}</p>
              <p className="text-xs text-text-secondary">
                Branch Manager · {branch.managerCode}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 text-sm text-text-secondary">
            <span className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {branch.address}
            </span>
            <span className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              {branch.phone}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              Since {formatDate(branch.openedAt)}
            </span>
            <span className="flex items-center gap-2">
              <UserRound className="h-3.5 w-3.5 shrink-0" />
              {branch.therapistCount} therapists · {branch.supportCount} support staff
            </span>
          </div>
        </Card>

        <Card className="flex flex-col gap-2 border-primary/20 bg-primary-light/30">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-primary-dark">
            <KeyRound className="h-3.5 w-3.5" />
            Manager Login
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Email</span>
            <span className="font-mono text-text-primary">{branch.managerEmail}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Password</span>
            <span className="font-mono text-text-secondary">
              ●●●●●●●● <span className="text-xs">(hashed, not retrievable)</span>
            </span>
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Today</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Today's Collection"
            value={formatCurrency(todayCollection?.total ?? 0)}
            icon={Wallet}
            tone="success"
          />
          <StatCard
            label="Patients Seen Today"
            value={String(metrics?.todayPatientsSeen ?? 0)}
            icon={Users}
          />
          <StatCard
            label="Due Collected Today"
            value={formatCurrency(metrics?.todayDueCollected ?? 0)}
            icon={ClipboardCheck}
            tone="purple"
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
          Inventory
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Material Items" value={String(materials?.totalItems ?? 0)} icon={Boxes} />
          <StatCard
            label="Stock Value"
            value={formatCurrency(materials?.totalStockValue ?? 0)}
            icon={Wallet}
            tone="success"
          />
          <StatCard
            label="Low Stock Items"
            value={String(materials?.lowStockCount ?? 0)}
            icon={AlertTriangle}
            tone={materials && materials.lowStockCount > 0 ? "danger" : "primary"}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Recent Transactions
        </h2>
        <Card>
          {recentLoading && <LoadingState label="Loading transactions…" />}
          {!recentLoading && (!recent || recent.results.length === 0) && (
            <EmptyState label="No transactions recorded for this branch yet." />
          )}
          {!recentLoading && recent && recent.results.length > 0 && (
            <TransactionTable transactions={recent.results} />
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

      <Modal
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Branch"
        description="Leave the password blank to keep the current one."
      >
        <BranchForm
          initialValues={branch}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditOpen(false)}
          isSubmitting={updateBranch.isPending}
        />
      </Modal>
    </div>
  );
}
