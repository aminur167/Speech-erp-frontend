"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { AlertTriangle, CalendarCheck, CircleDashed, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { FilterBar, FILTER_FIELD_WIDTH } from "@/components/ui/FilterBar";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { PatientAttendanceTable } from "@/components/attendance/PatientAttendanceTable";
import { useAttendanceRoster } from "@/hooks/attendance/usePatientAttendance";
import { useAuthStore } from "@/store/authStore";
import { toLocalDateString } from "@/utils/time";
import type { AttendanceServiceKind } from "@/types/domain";

const PAGE_SIZE = 25;

/**
 * Monthly and installment are separate sheets, chosen here.
 *
 * They are separate because the manager takes them separately: the same
 * person can be in ongoing monthly therapy and paying off a package, and
 * turning up for one is not turning up for the other. A patient holding two
 * *monthly* services is still one row — they came in or they didn't.
 */
const SHEETS = [
  { key: "monthly", label: "Monthly Services" },
  { key: "installment", label: "Installment Services" },
] as const;

export function PatientAttendanceView({
  branchId: branchIdOverride,
  homeHref = "/manager/dashboard",
  roleLabel = "Branch Manager",
  readOnly = false,
}: {
  /** Admin only — a Manager is scoped to their own branch server-side. */
  branchId?: string;
  homeHref?: string;
  roleLabel?: string;
  /** Admin can read a branch's sheet but not mark it. */
  readOnly?: boolean;
} = {}) {
  const user = useAuthStore((state) => state.user);
  const branchId = branchIdOverride ?? user?.branchId ?? undefined;

  const [kind, setKind] = useState<AttendanceServiceKind>("monthly");
  const [date, setDate] = useState(() => toLocalDateString());
  const [search, setSearch] = useState("");
  const [unmarked, setUnmarked] = useState(false);
  const [alertsOnly, setAlertsOnly] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useAttendanceRoster({
    kind,
    date,
    search: search || undefined,
    unmarked: unmarked || undefined,
    alerts: alertsOnly || undefined,
    branchId,
    page,
    pageSize: PAGE_SIZE,
  });

  const rows = data?.results ?? [];
  const count = data?.count ?? 0;
  const markedOnPage = rows.filter((row) => row.record !== null).length;
  const alertsOnPage = rows.filter((row) => row.alert).length;

  /** Any filter change restarts paging — page 3 of a different sheet is meaningless. */
  const reset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  const today = toLocalDateString();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref={homeHref}
        breadcrumb={[roleLabel, "Attendance"]}
        title="Patient Attendance"
        subtitle="Who came in today — and who has quietly stopped coming."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="On this sheet" value={String(count)} icon={Users} />
        <StatCard
          label="Marked on this page"
          value={`${markedOnPage} / ${rows.length}`}
          icon={CalendarCheck}
          tone="success"
        />
        <StatCard
          label="Stopped coming"
          value={String(alertsOnPage)}
          icon={AlertTriangle}
          tone={alertsOnPage > 0 ? "danger" : undefined}
          hint="on this page"
        />
      </div>

      <FilterBar
        dateSlot={
          <Input
            type="date"
            aria-label="Attendance date"
            value={date}
            max={today}
            onChange={(event) => reset(setDate)(event.target.value)}
            containerClassName={FILTER_FIELD_WIDTH}
          />
        }
      >
        <div className="flex shrink-0 gap-1 rounded-lg border border-border bg-background p-1">
          {SHEETS.map((sheet) => (
            <button
              key={sheet.key}
              type="button"
              aria-pressed={kind === sheet.key}
              onClick={() => reset(setKind)(sheet.key)}
              className={clsx(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                kind === sheet.key
                  ? "bg-surface text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              {sheet.label}
            </button>
          ))}
        </div>

        <Input
          value={search}
          onChange={(event) => reset(setSearch)(event.target.value)}
          placeholder="Search by patient name or code…"
          containerClassName="w-full sm:w-64 shrink-0"
        />

        <Button
          variant={unmarked ? "primary" : "secondary"}
          onClick={() => reset(setUnmarked)(!unmarked)}
        >
          <CircleDashed className="h-4 w-4" />
          Not marked
        </Button>

        <Button
          variant={alertsOnly ? "danger" : "secondary"}
          onClick={() => reset(setAlertsOnly)(!alertsOnly)}
        >
          <AlertTriangle className="h-4 w-4" />
          Stopped coming
        </Button>
      </FilterBar>

      <Card>
        <div className="flex flex-col gap-4">
          {isLoading && <TableSkeleton columns={readOnly ? 3 : 4} />}
          {isError && <ErrorState onRetry={() => refetch()} />}
          {!isLoading && !isError && rows.length === 0 && (
            <EmptyState
              label={
                search || unmarked || alertsOnly
                  ? "No patient matches that."
                  : "Nobody has a running service of this kind yet."
              }
            />
          )}

          {!isLoading && !isError && rows.length > 0 && (
            <>
              <PatientAttendanceTable
                rows={rows}
                serviceKind={kind}
                date={date}
                readOnly={readOnly}
              />
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                count={count}
                onPageChange={setPage}
              />
            </>
          )}

          <p className="text-xs text-text-secondary">
            Attendance is a record only — it never changes what a patient owes. Marking
            an informed absence stops that patient being flagged as having stopped
            coming.
          </p>
        </div>
      </Card>
    </div>
  );
}
