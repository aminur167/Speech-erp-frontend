"use client";

import { useState } from "react";
import { Wallet, Receipt, CalendarClock, RefreshCw, Download } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/states";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { BranchFilterSelect } from "@/components/ui/BranchFilterSelect";
import { FilterBar, FILTER_FIELD_WIDTH } from "@/components/ui/FilterBar";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { VoidPaymentModal } from "@/components/payments/VoidPaymentModal";
import { RequestRefundModal } from "@/components/payments/RequestRefundModal";
import { useTransactions } from "@/hooks/transactions/useTransactions";
import { useTransactionsSummary } from "@/hooks/transactions/useTransactionsSummary";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/currency";
import { exportToCsv } from "@/utils/exportCsv";
import { toLocalDateString } from "@/utils/time";
import type { PaymentMethod, PaymentStatus } from "@/types/domain";
import type { SummaryPeriod, TransactionItem } from "@/lib/api/transactions";

const PAGE_SIZE = 10;

export function TransactionHistoryView({
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
  const isAdmin = user?.role === "admin";
  const canPickBranch = isAdmin && !branchIdOverride;

  const [selectedBranch, setSelectedBranch] = useState("");
  const branchId =
    branchIdOverride ??
    (user?.role === "manager" ? (user.branchId ?? undefined) : selectedBranch || undefined);

  const [search, setSearch] = useState("");
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [status, setStatus] = useState<PaymentStatus | "">("");
  const [period, setPeriod] = useState<SummaryPeriod>("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);
  const [voidingTransaction, setVoidingTransaction] = useState<TransactionItem | null>(null);
  const [refundingTransaction, setRefundingTransaction] = useState<TransactionItem | null>(null);

  const { data, isLoading, isFetching, isError, refetch } = useTransactions({
    search,
    method: method || undefined,
    status: status || undefined,
    period: period || undefined,
    date: date || undefined,
    branchId,
    page,
    pageSize: PAGE_SIZE,
  });
  const { data: summary } = useTransactionsSummary(branchId);

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
        homeHref={homeHref}
        breadcrumb={[roleLabel, "Transactions"]}
        title="Transaction History"
        subtitle="Every payment collected, searchable and exportable."
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
        <Select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as PaymentStatus | "");
            setPage(1);
          }}
          containerClassName={FILTER_FIELD_WIDTH}
        >
          <option value="">All statuses</option>
          <option value="paid">Paid</option>
          <option value="due">Due</option>
          <option value="refunded">Refunded</option>
          <option value="void">Void</option>
        </Select>
      </FilterBar>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Collected"
          value={formatCurrency(summary?.totalCollected ?? 0)}
          icon={Wallet}
          tone="success"
        />
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
                placeholder="Search patient, receipt or transaction ID…"
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

          {isLoading && <LoadingState label="Loading transactions…" />}
          {isError && <ErrorState onRetry={() => refetch()} />}
          {!isLoading && !isError && data?.results.length === 0 && (
            <EmptyState label="No transactions found." />
          )}
          {!isLoading && !isError && data && data.results.length > 0 && (
            <>
              <TransactionTable
                transactions={data.results}
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
