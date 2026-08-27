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
import { ExpenseTable } from "@/components/expenses/ExpenseTable";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { useExpenses } from "@/hooks/expenses/useExpenses";
import { useExpenseSummary } from "@/hooks/expenses/useExpenseSummary";
import { useUpdateExpenseStatus } from "@/hooks/expenses/useUpdateExpenseStatus";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/currency";
import { exportToCsv } from "@/utils/exportCsv";
import type { ExpenseCategory, ExpenseStatus } from "@/types/domain";

const PAGE_SIZE = 10;

export function ExpenseListView({
  homeHref,
  roleLabel,
}: {
  homeHref: string;
  roleLabel: string;
}) {
  const user = useAuthStore((state) => state.user);
  const isManager = user?.role === "manager";
  const canCreate = isManager;
  const canApprove = user?.role === "admin";
  const branchId = isManager ? (user?.branchId ?? undefined) : undefined;

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ExpenseStatus | "">("");
  const [category, setCategory] = useState<ExpenseCategory | "">("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, isError, refetch } = useExpenses({
    search,
    status: status || undefined,
    category: category || undefined,
    branchId,
    page,
    pageSize: PAGE_SIZE,
  });
  const { data: summary } = useExpenseSummary(branchId);
  const updateStatus = useUpdateExpenseStatus();

  const hasFilters = Boolean(search || status || category);

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setCategory("");
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Expenses"
          value={formatCurrency(summary?.total ?? 0)}
          icon={Receipt}
          tone="danger"
          hint={`${summary?.voucherCount ?? 0} vouchers recorded`}
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
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search voucher, description or payee…"
              className="max-w-xs"
            />
            <Select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value as ExpenseCategory | "");
                setPage(1);
              }}
              className="w-auto"
            >
              <option value="">All categories</option>
              <option value="rent">Rent</option>
              <option value="utilities">Utilities</option>
              <option value="salaries">Salaries</option>
              <option value="supplies">Supplies</option>
              <option value="equipment">Equipment</option>
              <option value="maintenance">Maintenance</option>
              <option value="marketing">Marketing</option>
              <option value="other">Other</option>
            </Select>
            <Select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as ExpenseStatus | "");
                setPage(1);
              }}
              className="w-auto"
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
                className="text-sm font-medium text-primary hover:underline"
              >
                Clear
              </button>
            )}

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
                onApprove={(id) => updateStatus.mutate({ id, status: "approved" })}
                onReject={(id) => updateStatus.mutate({ id, status: "rejected" })}
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
    </div>
  );
}
