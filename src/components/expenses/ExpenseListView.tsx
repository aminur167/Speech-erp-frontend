"use client";

import { useState } from "react";
import { Plus, Receipt, Clock, Wallet, CalendarClock, RefreshCw, Download } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/states";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { BranchFilterSelect } from "@/components/ui/BranchFilterSelect";
import { FilterBar, FILTER_FIELD_WIDTH } from "@/components/ui/FilterBar";
import { ExpenseTable } from "@/components/expenses/ExpenseTable";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { RejectExpenseModal } from "@/components/expenses/RejectExpenseModal";
import { useExpenses } from "@/hooks/expenses/useExpenses";
import { useExpenseSummary } from "@/hooks/expenses/useExpenseSummary";
import { useUpdateExpenseStatus } from "@/hooks/expenses/useUpdateExpenseStatus";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/currency";
import { exportToCsv } from "@/utils/exportCsv";
import { toLocalDateString } from "@/utils/time";
import type { Expense, ExpenseStatus } from "@/types/domain";
import type { SummaryPeriod } from "@/lib/api/expenses";

const PAGE_SIZE = 10;

export function ExpenseListView({
  homeHref,
  roleLabel,
  branchId: branchIdOverride,
}: {
  homeHref: string;
  roleLabel: string;
  /** Scopes the view to one branch regardless of role — used when Admin is browsing a specific branch. */
  branchId?: string;
}) {
  const user = useAuthStore((state) => state.user);
  const isManager = user?.role === "manager";
  const canCreate = isManager;
  const canApprove = user?.role === "admin";
  const canPickBranch = user?.role === "admin" && !branchIdOverride;
  const [selectedBranch, setSelectedBranch] = useState("");
  const branchId =
    branchIdOverride ?? (isManager ? (user?.branchId ?? undefined) : selectedBranch || undefined);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ExpenseStatus | "">("");
  const [period, setPeriod] = useState<SummaryPeriod>("");
  const [date, setDate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [rejectingExpense, setRejectingExpense] = useState<Expense | null>(null);

  const { data, isLoading, isFetching, isError, refetch } = useExpenses({
    search,
    status: status || undefined,
    period: period || undefined,
    date: date || undefined,
    branchId,
    page,
    pageSize: PAGE_SIZE,
  });
  const { data: summary } = useExpenseSummary(branchId);
  const updateStatus = useUpdateExpenseStatus();

  const hasFilters = Boolean(search || status || period || date || selectedBranch);

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setPeriod("");
    setDate("");
    setSelectedBranch("");
    setPage(1);
  };

  const handleExport = () => {
    exportToCsv(
      "expenses.csv",
      (data?.results ?? []).map((expense) => ({
        "Expense ID": expense.expenseCode,
        Date: new Date(expense.createdAt).toLocaleDateString(),
        Category: expense.category,
        Description: expense.description,
        "Paid To": expense.paidTo,
        Amount: expense.amount,
        Status: expense.status,
      })),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref={homeHref}
        breadcrumb={[roleLabel, "Expense"]}
        title="Expense"
        subtitle="Track branch expenses, manage approvals and monitor spending."
        action={
          canCreate && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          )
        }
      />

      <FilterBar
        dateSlot={
          <Input
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setPeriod("");
              setPage(1);
            }}
            containerClassName={FILTER_FIELD_WIDTH}
            max={toLocalDateString()}
          />
        }
      >
        {canPickBranch && (
          <BranchFilterSelect
            value={selectedBranch}
            onChange={(value) => {
              setSelectedBranch(value);
              setPage(1);
            }}
          />
        )}
        <Select
          value={period}
          onChange={(event) => {
            setPeriod(event.target.value as SummaryPeriod);
            setDate("");
            setPage(1);
          }}
          containerClassName={FILTER_FIELD_WIDTH}
        >
          <option value="">All time</option>
          <option value="today">Today</option>
          <option value="month">This month</option>
        </Select>
        <Select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as ExpenseStatus | "");
            setPage(1);
          }}
          containerClassName={FILTER_FIELD_WIDTH}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            Clear
          </button>
        )}
      </FilterBar>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Expenses"
          value={formatCurrency(summary?.total ?? 0)}
          icon={Receipt}
          tone="danger"
          hint={
            summary?.pendingAmount
              ? `${formatCurrency(summary.pendingAmount)} awaiting approval`
              : `${summary?.voucherCount ?? 0} vouchers recorded`
          }
        />
        <StatCard
          label="Today's Expenses"
          value={formatCurrency(summary?.todayTotal ?? 0)}
          icon={Clock}
          tone="warning"
          hint="Daily branch operational cost"
        />
        <StatCard
          label="Monthly Expenses"
          value={formatCurrency(summary?.monthTotal ?? 0)}
          icon={Wallet}
          tone="info"
          hint="Current month total"
        />
        <StatCard
          label="Pending Approvals"
          value={String(summary?.pendingCount ?? 0)}
          icon={CalendarClock}
          tone="purple"
          hint="Awaiting Admin review"
        />
      </div>

      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[220px] flex-1">
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search voucher, description or payee…"
              />
            </div>
            <div className="ml-auto flex gap-2">
              <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={clsx("h-4 w-4", isFetching && "animate-spin")} />
                Refresh
              </Button>
              <Button
                variant="secondary"
                onClick={handleExport}
                disabled={!data || data.results.length === 0}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {isLoading && <LoadingState label="Loading expenses…" />}
          {isError && <ErrorState onRetry={() => refetch()} />}
          {!isLoading && !isError && data?.results.length === 0 && (
            <EmptyState label="No expenses found." />
          )}
          {!isLoading && !isError && data && data.results.length > 0 && (
            <>
              <ExpenseTable
                expenses={data.results}
                canApprove={canApprove}
                isMutating={updateStatus.isPending}
                onApprove={(id) => updateStatus.mutate({ id, approve: true })}
                onReject={(id) => {
                  const expense = data.results.find((item) => item.id === id);
                  if (expense) setRejectingExpense(expense);
                }}
              />
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                count={data.count}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </Card>

      {canCreate && (
        <Modal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add New Expense"
          description="Fill in the expense details below. Amounts are in Bangladeshi Taka (BDT)."
        >
          <ExpenseForm
            onSuccess={() => setIsModalOpen(false)}
            onCancel={() => setIsModalOpen(false)}
          />
        </Modal>
      )}

      {canApprove && (
        <RejectExpenseModal
          expense={rejectingExpense}
          onClose={() => setRejectingExpense(null)}
        />
      )}
    </div>
  );
}
