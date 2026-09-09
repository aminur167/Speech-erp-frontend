"use client";

import { useState } from "react";
import { AlertCircle, Wallet, Receipt as ReceiptIcon } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { FilterBar } from "@/components/ui/FilterBar";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { DuePaymentTable } from "@/components/duePayments/DuePaymentTable";
import { MonthCyclePicker } from "@/components/duePayments/MonthCyclePicker";
import { CollectDuePaymentModal } from "@/components/duePayments/CollectDuePaymentModal";
import { useDuePayments } from "@/hooks/duePayments/useDuePayments";
import { useDuePaymentsSummary } from "@/hooks/duePayments/useDuePaymentsSummary";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/currency";
import { monthKeyLabel, toMonthKey } from "@/utils/months";
import type { DuePaymentItem, DuePaymentType } from "@/lib/api/duePayments";

const PAGE_SIZE = 10;

/**
 * The two kinds of due, one at a time.
 *
 * Side by side they each got half the width, which on a laptop squeezed the
 * patient code into a vertical stack of characters and wrapped every status
 * badge onto two lines. One list at full width reads properly, and the
 * choice between them belongs in the filter row with the rest of the
 * filters — it is one, not a layout.
 */
const VIEWS = [
  { key: "installment", label: "Installment Dues" },
  { key: "monthly", label: "Monthly Dues" },
] as const;

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
  /** Hides the collect action — Admin can view dues but shouldn't collect on a branch's behalf. */
  readOnly?: boolean;
} = {}) {
  const user = useAuthStore((state) => state.user);
  const branchId = branchIdOverride ?? user?.branchId ?? undefined;

  // Opens on monthly: it is the cycle a manager collects for on any ordinary
  // day, and the one with a deadline attached to it.
  const [type, setType] = useState<DuePaymentType>("monthly");
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(toMonthKey);
  const [page, setPage] = useState(1);

  const [selectedItem, setSelectedItem] = useState<DuePaymentItem | null>(null);

  const active = VIEWS.find((view) => view.key === type)!;
  const isMonthly = type === "monthly";

  const { data, isLoading, isError, refetch } = useDuePayments({
    type,
    // The month narrows the monthly cycle only; an installment plan has its
    // own schedule and no monthly deadline to be measured against.
    month: isMonthly ? month : undefined,
    search: search || undefined,
    branchId,
    page,
    pageSize: PAGE_SIZE,
  });
  const { data: summary } = useDuePaymentsSummary(branchId);

  const changeType = (next: DuePaymentType) => {
    setType(next);
    setPage(1);
  };



  const actions = readOnly ? {} : { onCollectPayment: setSelectedItem };

  const rows = data?.results ?? [];
  const count = data?.count ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref={homeHref}
        breadcrumb={[roleLabel, "Due Payment Collection"]}
        title="Due Payment Collection"
        subtitle="Collect what patients owe, one list at a time."
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

      <FilterBar
        dateSlot={
          // Only the monthly list has a cycle to move through. Showing the
          // picker against installments would offer a filter that does
          // nothing, which is worse than not offering one.
          isMonthly ? (
            <MonthCyclePicker
              value={month}
              onChange={(next) => {
                setMonth(next);
                setPage(1);
              }}
            />
          ) : undefined
        }
      >
        <div className="flex shrink-0 gap-1 rounded-lg border border-border bg-background p-1">
          {VIEWS.map((view) => (
            <button
              key={view.key}
              type="button"
              aria-pressed={type === view.key}
              onClick={() => changeType(view.key)}
              className={clsx(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                type === view.key
                  ? "bg-surface text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              {view.label}
            </button>
          ))}
        </div>

        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search by patient name or code…"
          containerClassName="w-full sm:w-72 shrink-0"
        />
      </FilterBar>

      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold text-text-primary">{active.label}</h2>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary">
                <span className="rounded-full bg-background px-2 py-0.5 font-medium">
                  {isMonthly ? monthKeyLabel(month) : "Payable now"}
                </span>
                <span>
                  {count} {count === 1 ? "patient" : "patients"}
                </span>
                {/* Totals every row the filters matched, not the ten on
                    screen — a per-page subtotal labelled as the total is
                    worse than no total at all. */}
                <span>&middot; {formatCurrency(data?.totalAmount ?? 0)} due</span>
              </div>
            </div>
          </div>

          {isLoading && <TableSkeleton columns={readOnly ? 5 : 6} />}
          {isError && <ErrorState onRetry={() => refetch()} />}
          {!isLoading && !isError && rows.length === 0 && (
            <EmptyState
              label={
                isMonthly
                  ? `Nobody owes for ${monthKeyLabel(month)} — the cycle is settled.`
                  : "No installment dues — every plan is up to date."
              }
            />
          )}

          {!isLoading && !isError && rows.length > 0 && (
            <>
              <DuePaymentTable items={rows} showType={false} {...actions} />
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                count={count}
                onPageChange={setPage}
              />
            </>
          )}

          {isMonthly && (
            <p className="text-xs text-text-secondary">
              A patient who has paid {monthKeyLabel(month)} moves to the next cycle and
              drops out of this list; one who has not stays here until they pay,
              whichever month you are looking at.
            </p>
          )}
        </div>
      </Card>

      <CollectDuePaymentModal item={selectedItem} onClose={() => setSelectedItem(null)} />

    </div>
  );
}
