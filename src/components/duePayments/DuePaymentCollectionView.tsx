"use client";

import { useState } from "react";
import { AlertCircle, Wallet, Receipt as ReceiptIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/states";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { DuePaymentTable } from "@/components/duePayments/DuePaymentTable";
import { CollectDuePaymentModal } from "@/components/duePayments/CollectDuePaymentModal";
import { useDuePayments } from "@/hooks/duePayments/useDuePayments";
import { useDuePaymentsSummary } from "@/hooks/duePayments/useDuePaymentsSummary";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/currency";
import type { DuePaymentItem, DuePaymentType } from "@/lib/api/duePayments";

const PAGE_SIZE = 10;

export function DuePaymentCollectionView() {
  const user = useAuthStore((state) => state.user);
  const branchId = user?.branchId ?? undefined;

  const [search, setSearch] = useState("");
  const [type, setType] = useState<DuePaymentType | "">("");
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<DuePaymentItem | null>(null);

  const { data, isLoading, isError, refetch } = useDuePayments({
    search,
    type: type || undefined,
    branchId,
    page,
    pageSize: PAGE_SIZE,
  });
  const { data: summary } = useDuePaymentsSummary(branchId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref="/manager/dashboard"
        breadcrumb={["Branch Manager", "Due Payment Collection"]}
        title="Due Payment Collection"
        subtitle="Review and collect outstanding installment and monthly dues."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Due"
          value={formatCurrency(summary?.totalDue ?? 0)}
          icon={AlertCircle}
          tone="danger"
        />
        <StatCard
          label="Installment"
          value={formatCurrency(summary?.installmentDue ?? 0)}
          icon={ReceiptIcon}
          tone="purple"
        />
        <StatCard
          label="Monthly"
          value={formatCurrency(summary?.monthlyDue ?? 0)}
          icon={Wallet}
          tone="warning"
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
              placeholder="Search by patient name or code…"
              className="max-w-xs"
            />
            <Select
              value={type}
              onChange={(event) => {
                setType(event.target.value as DuePaymentType | "");
                setPage(1);
              }}
              className="w-auto"
            >
              <option value="">All types</option>
              <option value="monthly">Monthly</option>
              <option value="installment">Installment</option>
            </Select>
          </div>

          {isLoading && <LoadingState label="Loading due payments…" />}
          {isError && <ErrorState onRetry={() => refetch()} />}
          {!isLoading && !isError && data?.results.length === 0 && (
            <EmptyState label="No due payments — everything is settled." />
          )}
          {!isLoading && !isError && data && data.results.length > 0 && (
            <>
              <DuePaymentTable items={data.results} onCollectPayment={setSelectedItem} />
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

      <CollectDuePaymentModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
