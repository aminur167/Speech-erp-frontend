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
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { useTransactions } from "@/hooks/transactions/useTransactions";
import { useTransactionsSummary } from "@/hooks/transactions/useTransactionsSummary";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/currency";
import { exportToCsv } from "@/utils/exportCsv";
import type { PaymentMethod, PaymentStatus } from "@/types/domain";

const PAGE_SIZE = 10;

export function TransactionHistoryView({
  homeHref,
  roleLabel,
}: {
  homeHref: string;
  roleLabel: string;
}) {
  const user = useAuthStore((state) => state.user);
  const branchId = user?.role === "manager" ? (user.branchId ?? undefined) : undefined;

  const [search, setSearch] = useState("");
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [status, setStatus] = useState<PaymentStatus | "">("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, isError, refetch } = useTransactions({
    search,
    method: method || undefined,
    status: status || undefined,
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

          <div className="flex flex-nowrap items-center gap-3 overflow-x-auto pb-1">
            <Select
              value={method}
              onChange={(event) => {
                setMethod(event.target.value as PaymentMethod | "");
                setPage(1);
              }}
              containerClassName="w-auto shrink-0"
              className="w-auto"
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
              containerClassName="w-auto shrink-0"
              className="w-auto"
            >
              <option value="">All statuses</option>
              <option value="paid">Paid</option>
              <option value="due">Due</option>
              <option value="refunded">Refunded</option>
              <option value="void">Void</option>
            </Select>
          </div>

          {isLoading && <LoadingState label="Loading transactions…" />}
          {isError && <ErrorState onRetry={() => refetch()} />}
          {!isLoading && !isError && data?.results.length === 0 && (
            <EmptyState label="No transactions found." />
          )}
          {!isLoading && !isError && data && data.results.length > 0 && (
            <>
              <TransactionTable transactions={data.results} />
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
    </div>
  );
}
