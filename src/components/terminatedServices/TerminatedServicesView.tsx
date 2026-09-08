"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/states";
import { FilterBar } from "@/components/ui/FilterBar";
import { PageHeader } from "@/components/layout/PageHeader";
import { MonthCyclePicker } from "@/components/duePayments/MonthCyclePicker";
import { toMonthKey } from "@/utils/months";
import { TerminatedServicesTable } from "@/components/terminatedServices/TerminatedServicesTable";
import { ResumeServiceModal } from "@/components/terminatedServices/ResumeServiceModal";
import { useTerminatedServices } from "@/hooks/terminatedServices/useTerminatedServices";
import { useResumeMonthlyService } from "@/hooks/terminatedServices/useResumeMonthlyService";
import { useAuthStore } from "@/store/authStore";
import type { ApiError } from "@/types/api";
import type { TerminatedMonthlyService } from "@/lib/api/monthlyEnrollments";
import type { PaymentMethod } from "@/types/domain";

const PAGE_SIZE = 10;

/**
 * Monthly services the nightly job stopped because a month's due went unpaid
 * to the end of that month — and the one screen that can restart them.
 *
 * A manager's own termination never appears here: that one already forgave
 * the debt and closed the service deliberately, so the honest way back is a
 * fresh enrollment, not a reinstatement.
 */
export function TerminatedServicesView({
  branchId: branchIdOverride,
  homeHref = "/manager/due-payments",
  roleLabel = "Branch Manager",
  readOnly = false,
}: {
  /** Admin only — a Manager is scoped to their own branch server-side. */
  branchId?: string;
  homeHref?: string;
  roleLabel?: string;
  /** Hides Resume — Admin can look without restarting a branch's service. */
  readOnly?: boolean;
} = {}) {
  const user = useAuthStore((state) => state.user);
  const branchId = branchIdOverride ?? user?.branchId ?? undefined;

  const [search, setSearch] = useState("");
  // Off by default: a manager arrives looking for one patient, not for a
  // particular month, and pre-filtering would hide the very row they came for.
  const [month, setMonth] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [resuming, setResuming] = useState<TerminatedMonthlyService | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useTerminatedServices({
    search: search || undefined,
    month: month || undefined,
    branchId,
    page,
    pageSize: PAGE_SIZE,
  });
  const resumeService = useResumeMonthlyService();

  const closeResumeDialog = () => {
    setResuming(null);
    setResumeError(null);
  };

  const handleConfirmResume = ({
    carryDue,
    method,
  }: {
    carryDue: boolean;
    method: PaymentMethod;
  }) => {
    if (!resuming) return;

    resumeService.mutate(
      { id: resuming.id, carryDue, method },
      {
        // Closing on success is what makes it feel finished; the list behind
        // refetches from the mutation's own invalidation, and the row is gone
        // because the service is running again.
        onSuccess: closeResumeDialog,
        onError: (error: ApiError) => setResumeError(error.message),
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref={homeHref}
        breadcrumb={[roleLabel, "Terminated Services"]}
        title="Terminated Services"
        subtitle="Monthly services stopped automatically because a month's due went unpaid."
      />

      <FilterBar
        dateSlot={
          month === null ? (
            <Button variant="secondary" onClick={() => setMonth(toMonthKey())}>
              Filter by month
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <MonthCyclePicker
                value={month}
                onChange={(next) => {
                  setMonth(next);
                  setPage(1);
                }}
              />
              <Button
                variant="secondary"
                onClick={() => {
                  setMonth(null);
                  setPage(1);
                }}
              >
                All months
              </Button>
            </div>
          )
        }
      >
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Patient ID, name, phone, or service ID…"
          containerClassName="w-full sm:w-80 shrink-0"
        />
      </FilterBar>

      <Card>
        <div className="flex flex-col gap-4">
          {isLoading && <LoadingState label="Loading terminated services…" />}
          {isError && <ErrorState onRetry={() => refetch()} />}
          {!isLoading && !isError && data?.results.length === 0 && (
            <EmptyState
              label={
                search || month
                  ? "No terminated service matches that."
                  : "No service has been terminated — every monthly due is being cleared on time."
              }
            />
          )}
          {!isLoading && !isError && data && data.results.length > 0 && (
            <>
              <TerminatedServicesTable
                services={data.results}
                onResume={
                  readOnly
                    ? undefined
                    : (service) => {
                        setResumeError(null);
                        setResuming(service);
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

      <ResumeServiceModal
        service={resuming}
        onConfirm={handleConfirmResume}
        onClose={closeResumeDialog}
        isResuming={resumeService.isPending}
        error={resumeError}
      />
    </div>
  );
}