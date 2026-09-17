"use client";

import { useState } from "react";
import {
  Wallet,
  Receipt,
  CalendarClock,
  RefreshCw,
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/states";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { BranchFilterSelect } from "@/components/ui/BranchFilterSelect";
import { FilterBar, FILTER_FIELD_WIDTH } from "@/components/ui/FilterBar";
import { SearchField } from "@/components/ui/SearchField";
import { TransactionFeed, transactionDirection } from "@/components/transactions/TransactionFeed";
import { VoidPaymentModal } from "@/components/payments/VoidPaymentModal";
import { RequestRefundModal } from "@/components/payments/RequestRefundModal";
import { useTransactions } from "@/hooks/transactions/useTransactions";
import { useTransactionsSummary } from "@/hooks/transactions/useTransactionsSummary";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/currency";
import { exportToCsv } from "@/utils/exportCsv";
import { monthKeyLabel, shiftMonthKey, splitMonthKey, toMonthKey } from "@/utils/months";
import { toLocalDateString } from "@/utils/time";
import type { PaymentMethod } from "@/types/domain";
import type { TransactionItem } from "@/lib/api/transactions";

type FeedTab = "all" | "in" | "out";

/** First and last calendar day of a "YYYY-MM" cycle, as "YYYY-MM-DD". */
function monthBounds(monthKey: string): { dateFrom: string; dateTo: string } {
  const { year, month } = splitMonthKey(monthKey);
  return {
    dateFrom: toLocalDateString(new Date(year, month - 1, 1)),
    dateTo: toLocalDateString(new Date(year, month, 0)),
  };
}

const PAGE_SIZE = 10;

export function TransactionHistoryView({
  branchId: branchIdOverride,
}: {
  /** Scopes the view to one branch regardless of role — used when Admin is browsing a specific branch. */
  branchId?: string;
}) {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "admin";
  const canPickBranch = isAdmin && !branchIdOverride;

  const [selectedBranch, setSelectedBranch] = useState("");
  const branchId =
    branchIdOverride ??
    (user?.role === "manager" ? (user.branchId ?? undefined) : selectedBranch || undefined);

  const [search, setSearch] = useState("");
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [monthKey, setMonthKey] = useState(toMonthKey());
  const [tab, setTab] = useState<FeedTab>("all");
  const [page, setPage] = useState(1);
  const [voidingTransaction, setVoidingTransaction] = useState<TransactionItem | null>(null);
  const [refundingTransaction, setRefundingTransaction] = useState<TransactionItem | null>(null);

  const { dateFrom, dateTo } = monthBounds(monthKey);
  const { data, isLoading, isFetching, isError, refetch } = useTransactions({
    search,
    method: method || undefined,
    dateFrom,
    dateTo,
    branchId,
    page,
    pageSize: PAGE_SIZE,
  });
  const { data: summary } = useTransactionsSummary(branchId);

  const visibleTransactions = (data?.results ?? []).filter((transaction) => {
    if (tab === "all") return true;
    return transactionDirection(transaction) === tab;
  });

  const changeMonth = (by: number) => {
    setMonthKey((current) => shiftMonthKey(current, by));
    setPage(1);
  };

  const handleExport = () => {
    exportToCsv(
      "transactions.csv",
      (data?.results ?? []).map((transaction) => ({
        "Receipt No": transaction.receiptNumber,
        "Transaction ID": transaction.transactionId,
        Date: new Date(transaction.createdAt).toLocaleString(),
        Patient: transaction.patientName,
        "Patient ID": transaction.patientCode,
        Method: transaction.method,
        Status: transaction.status,
        Amount: transaction.amount,
        "Collected By": transaction.collectedBy,
      })),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Transaction History"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total (Net)"
          value={formatCurrency((summary?.totalCollected ?? 0) - (summary?.totalRefunded ?? 0))}
          icon={Wallet}
          tone="primary"
          hint="All-time collections minus refunds"
        />
        <StatCard
          label="In"
          value={formatCurrency(summary?.totalCollected ?? 0)}
          icon={ArrowDownLeft}
          tone="success"
          hint="All-time money collected"
        />
        <StatCard
          label="Out"
          value={formatCurrency(summary?.totalRefunded ?? 0)}
          icon={ArrowUpRight}
          tone="danger"
          hint="All-time money refunded"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Today's Collection"
          value={formatCurrency(summary?.todayCollected ?? 0)}
          icon={CalendarClock}
          tone="info"
        />
        <StatCard
          label="This Month's Collection"
          value={formatCurrency(summary?.monthCollected ?? 0)}
          icon={CalendarClock}
          tone="purple"
        />
        <StatCard
          label="Transactions"
          value={String(summary?.transactionCount ?? 0)}
          icon={Receipt}
          tone="primary"
        />
      </div>

      <div className="flex items-center justify-center gap-3 rounded-xl border border-border bg-surface px-4 py-2.5 shadow-sm">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          aria-label="Previous month"
          title="Previous month"
          className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-primary-light hover:text-text-primary"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[9rem] text-center text-sm font-semibold text-text-primary">
          {monthKeyLabel(monthKey)}
        </span>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          aria-label="Next month"
          title="Next month"
          className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-primary-light hover:text-text-primary"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-6 border-b border-border px-1">
        {(["all", "in", "out"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={clsx(
              "border-b-2 pb-2.5 text-sm font-semibold capitalize transition-colors",
              tab === value
                ? "border-primary text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary",
            )}
          >
            {value}
          </button>
        ))}
      </div>

      <FilterBar
        search={
          <SearchField
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search patient, receipt or transaction ID…"
          />
        }
        actions={
          <>
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
          </>
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
          label="Method"
          value={method}
          onChange={(event) => {
            setMethod(event.target.value as PaymentMethod | "");
            setPage(1);
          }}
          containerClassName={FILTER_FIELD_WIDTH}
        >
          <option value="">All methods</option>
          <option value="cash">Cash</option>
          <option value="bkash">bKash</option>
          <option value="nagad">Nagad</option>
          <option value="rocket">Rocket</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="online_payment">Online Payment</option>
          <option value="card">Card</option>
        </Select>
      </FilterBar>

      <Card>
        <div className="flex flex-col gap-4">
          {isLoading && <LoadingState label="Loading transactions…" />}
          {isError && <ErrorState onRetry={() => refetch()} />}
          {!isLoading && !isError && data?.results.length === 0 && (
            <EmptyState label="No transactions found." />
          )}
          {!isLoading && !isError && data && data.results.length > 0 && visibleTransactions.length === 0 && (
            <EmptyState label={`No ${tab} transactions this month.`} />
          )}
          {!isLoading && !isError && data && visibleTransactions.length > 0 && (
            <>
              <TransactionFeed
                transactions={visibleTransactions}
                canVoid={Boolean(user)}
                canRequestRefund={user?.role === "manager"}
                onVoid={setVoidingTransaction}
                onRequestRefund={setRefundingTransaction}
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

      <VoidPaymentModal payment={voidingTransaction} onClose={() => setVoidingTransaction(null)} />
      <RequestRefundModal
        payment={refundingTransaction}
        onClose={() => setRefundingTransaction(null)}
      />
    </div>
  );
}
