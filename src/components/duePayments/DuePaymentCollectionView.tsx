"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, Wallet, Receipt as ReceiptIcon, Ban } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/states";
import { FilterBar } from "@/components/ui/FilterBar";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { DuePaymentTable } from "@/components/duePayments/DuePaymentTable";
import { MonthCyclePicker } from "@/components/duePayments/MonthCyclePicker";
import { CollectDuePaymentModal } from "@/components/duePayments/CollectDuePaymentModal";
import { TerminateServiceModal } from "@/components/duePayments/TerminateServiceModal";
import { useDuePayments } from "@/hooks/duePayments/useDuePayments";
import { useDuePaymentsSummary } from "@/hooks/duePayments/useDuePaymentsSummary";
import { useTerminateService } from "@/hooks/duePayments/useTerminateService";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/currency";
import { monthKeyLabel, toMonthKey } from "@/utils/months";
import type { ApiError } from "@/types/api";
import type { DuePaymentItem, DuePaymentPage } from "@/lib/api/duePayments";
import type { UseQueryResult } from "@tanstack/react-query";

// Smaller than a full-width list: the two tables sit side by side, so ten
// rows each would push the page taller than the screen before either one
// could be scanned.
const PAGE_SIZE = 8;

/**
 * One of the two tables, with its own heading, totals, states and paging.
 *
 * Shared rather than written twice — the halves differ only in what they
 * list and in the monthly one's cycle picker, and two copies of the
 * loading/empty/error/pagination logic is how the two sides start behaving
 * differently for no reason anyone intended.
 */
function DueTableCard({
  title,
  caption,
  query,
  filter,
  onCollectPayment,
  onTerminate,
  page,
  onPageChange,
  emptyLabel,
}: {
  title: string;
  caption: string;
  query: UseQueryResult<DuePaymentPage, ApiError>;
  /** Rendered next to the heading — the monthly side's cycle picker. */
  filter?: ReactNode;
  onCollectPayment?: (item: DuePaymentItem) => void;
  onTerminate?: (item: DuePaymentItem) => void;
  page: number;
  onPageChange: (page: number) => void;
  emptyLabel: string;
}) {
  const { data, isLoading, isError, refetch } = query;
  const rows = data?.results ?? [];

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
            <p className="text-xs text-text-secondary">
              {caption} &middot; {data?.count ?? 0}{" "}
              {(data?.count ?? 0) === 1 ? "patient" : "patients"} &middot;{" "}
              {formatCurrency(data?.totalAmount ?? 0)} due
            </p>
          </div>
          {filter}
        </div>

        {isLoading && <LoadingState label="Loading due payments…" />}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {!isLoading && !isError && rows.length === 0 && <EmptyState label={emptyLabel} />}

        {!isLoading && !isError && rows.length > 0 && (
          <>
            <DuePaymentTable
              items={rows}
              showType={false}
              onCollectPayment={onCollectPayment}
              onTerminate={onTerminate}
            />
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              count={data?.count ?? 0}
              onPageChange={onPageChange}
            />
          </>
        )}
      </div>
    </Card>
  );
}

export function DuePaymentCollectionView({
  branchId: branchIdOverride,
  homeHref = "/manager/dashboard",
  roleLabel = "Branch Manager",
  readOnly = false,
  terminatedHref = "/manager/terminated-services",
}: {
  /** Scopes the view to one branch regardless of the logged-in user — used when Admin is browsing a specific branch. */
  branchId?: string;
  homeHref?: string;
  roleLabel?: string;
  /** Where the "Terminated Services" button goes — the Admin drill-down has its own copy. */
  terminatedHref?: string;
  /** Hides the collect and terminate actions — Admin can view dues but shouldn't act on a branch's behalf. */
  readOnly?: boolean;
} = {}) {
  const user = useAuthStore((state) => state.user);
  const branchId = branchIdOverride ?? user?.branchId ?? undefined;

  const [search, setSearch] = useState("");
  // Opens on the running cycle, which is the one a manager is collecting for
  // on any ordinary day.
  const [month, setMonth] = useState(toMonthKey);
  const [installmentPage, setInstallmentPage] = useState(1);
  const [monthlyPage, setMonthlyPage] = useState(1);

  const [selectedItem, setSelectedItem] = useState<DuePaymentItem | null>(null);
  const [terminatingItem, setTerminatingItem] = useState<DuePaymentItem | null>(null);
  const [terminateError, setTerminateError] = useState<string | null>(null);

  const installments = useDuePayments({
    type: "installment",
    search: search || undefined,
    branchId,
    page: installmentPage,
    pageSize: PAGE_SIZE,
  });
  const monthly = useDuePayments({
    type: "monthly",
    month,
    search: search || undefined,
    branchId,
    page: monthlyPage,
    pageSize: PAGE_SIZE,
  });
  const { data: summary } = useDuePaymentsSummary(branchId);
  const terminateService = useTerminateService();

  const changeSearch = (value: string) => {
    setSearch(value);
    setInstallmentPage(1);
    setMonthlyPage(1);
  };

  const changeMonth = (value: string) => {
    setMonth(value);
    setMonthlyPage(1);
  };

  const closeTerminateDialog = () => {
    setTerminatingItem(null);
    setTerminateError(null);
  };

  const handleConfirmTerminate = () => {
    if (!terminatingItem) return;

    terminateService.mutate(
      { type: terminatingItem.type, refId: terminatingItem.refId },
      {
        // Closing on success is what makes the modal feel finished; the lists
        // behind it refetch from the mutation's own invalidation.
        onSuccess: closeTerminateDialog,
        // An outstanding balance no longer refuses, so anything landing here
        // is a genuine failure worth showing rather than a workflow branch.
        onError: (error: ApiError) => setTerminateError(error.message),
      },
    );
  };

  // One pair of handlers for both tables: which side a row came from doesn't
  // change what collecting or terminating it means.
  const actions = readOnly
    ? {}
    : {
        onCollectPayment: setSelectedItem,
        onTerminate: (item: DuePaymentItem) => {
          setTerminateError(null);
          setTerminatingItem(item);
        },
      };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref={homeHref}
        breadcrumb={[roleLabel, "Due Payment Collection"]}
        title="Due Payment Collection"
        subtitle="Installment plans on the left, this month's monthly cycle on the right."
        action={
          // The two screens are the same story either side of a deadline:
          // what is still collectable, and what stopped because it wasn't
          // collected in time. Reaching one from the other is how a manager
          // actually moves between them.
          <Link href={terminatedHref}>
            <Button variant="secondary">
              <Ban className="h-4 w-4" />
              Terminated Services
            </Button>
          </Link>
        }
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

      <FilterBar>
        <Input
          value={search}
          onChange={(event) => changeSearch(event.target.value)}
          placeholder="Search both tables by patient name or code…"
          containerClassName="w-full sm:w-80 shrink-0"
        />
      </FilterBar>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DueTableCard
          title="Installment Dues"
          caption="Payable now"
          query={installments}
          page={installmentPage}
          onPageChange={setInstallmentPage}
          emptyLabel="No installment dues — every plan is up to date."
          {...actions}
        />

        <DueTableCard
          title="Monthly Dues"
          caption={monthKeyLabel(month)}
          query={monthly}
          page={monthlyPage}
          onPageChange={setMonthlyPage}
          emptyLabel={`Nobody owes for ${monthKeyLabel(month)} — the cycle is settled.`}
          filter={<MonthCyclePicker value={month} onChange={changeMonth} />}
          {...actions}
        />
      </div>

      <p className="text-xs text-text-secondary">
        A patient who has paid {monthKeyLabel(month)} moves to the next cycle and drops
        out of this table; one who has not stays here until they pay, whichever month
        you are looking at.
      </p>

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
