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
import { TerminateServiceModal } from "@/components/duePayments/TerminateServiceModal";
import { useDuePayments } from "@/hooks/duePayments/useDuePayments";
import { useDuePaymentsSummary } from "@/hooks/duePayments/useDuePaymentsSummary";
import { useTerminateService } from "@/hooks/duePayments/useTerminateService";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/currency";
import type { ApiError } from "@/types/api";
import type { DuePaymentItem, DuePaymentType } from "@/lib/api/duePayments";

const PAGE_SIZE = 10;

export function DuePaymentCollectionView({
  branchId: branchIdOverride,
  homeHref = "/manager/dashboard",
  roleLabel = "Branch Manager",
  readOnly = false,
}: {
  /** Scopes the view to one branch regardless of the logged-in user — used when Admin is browsing a specific branch. */
  branchId?: string;
  homeHref?: string;
  roleLabel?: string;
  /** Hides the "Collect Payment" action — Admin can view dues but shouldn't collect on a branch's behalf. */
  readOnly?: boolean;
} = {}) {
  const user = useAuthStore((state) => state.user);
  const branchId = branchIdOverride ?? user?.branchId ?? undefined;

  const [search, setSearch] = useState("");
  const [type, setType] = useState<DuePaymentType | "">("");
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<DuePaymentItem | null>(null);
  const [terminatingItem, setTerminatingItem] = useState<DuePaymentItem | null>(null);
  const [terminateError, setTerminateError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useDuePayments({
    search,
    type: type || undefined,
    branchId,
    page,
    pageSize: PAGE_SIZE,
  });
  const { data: summary } = useDuePaymentsSummary(branchId);
  const terminateService = useTerminateService();

  const closeTerminateDialog = () => {
    setTerminatingItem(null);
    setTerminateError(null);
  };

  const handleConfirmTerminate = () => {
    if (!terminatingItem) return;

    terminateService.mutate(
      { type: terminatingItem.type, refId: terminatingItem.refId },
      {
        // Closing on success is what makes the modal feel finished; the list
        // behind it refetches from the mutation's own invalidation.
        onSuccess: closeTerminateDialog,
        // An outstanding balance no longer refuses, so anything landing here
        // is a genuine failure worth showing rather than a workflow branch.
        onError: (error: ApiError) => setTerminateError(error.message),
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref={homeHref}
        breadcrumb={[roleLabel, "Due Payment Collection"]}
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
              <DuePaymentTable
                items={data.results}
                onCollectPayment={readOnly ? undefined : setSelectedItem}
                onTerminate={
                  readOnly
                    ? undefined
                    : (item) => {
                        setTerminateError(null);
                        setTerminatingItem(item);
                      }
                }
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

      <CollectDuePaymentModal item={selectedItem} onClose={() => setSelectedItem(null)} />

      <TerminateServiceModal
        item={terminatingItem}
        onConfirm={handleConfirmTerminate}
        onClose={closeTerminateDialog}
        isTerminating={terminateService.isPending}
        error={terminateError}
      />
    </div>
  );
}
