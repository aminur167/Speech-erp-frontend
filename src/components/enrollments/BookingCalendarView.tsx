"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { LoadingState, ErrorState } from "@/components/ui/states";
import { PageHeader } from "@/components/layout/PageHeader";
import { BranchFilterSelect } from "@/components/ui/BranchFilterSelect";
import { FilterBar, FILTER_FIELD_WIDTH } from "@/components/ui/FilterBar";
import { useBookings } from "@/hooks/enrollments/useBookings";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/currency";
import { formatTimeLabel } from "@/utils/time";
import type { Booking } from "@/types/domain";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_VISIBLE_PER_DAY = 3;

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The 6-row grid a month calendar needs, including the leading/trailing days of neighboring months. */
function buildCalendarGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const start = new Date(firstOfMonth);
  start.setDate(start.getDate() - firstOfMonth.getDay());

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function BookingCalendarView({
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

  const [status, setStatus] = useState<Booking["status"] | "">("");
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const grid = useMemo(() => buildCalendarGrid(cursor.year, cursor.month), [cursor]);
  const dateFrom = toISODate(grid[0]);
  const dateTo = toISODate(grid[grid.length - 1]);
  const todayISO = toISODate(new Date());

  const { data, isLoading, isFetching, isError, refetch } = useBookings({
    dateFrom,
    dateTo,
    status: status || undefined,
    branchId,
  });

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const booking of data?.results ?? []) {
      const list = map.get(booking.date) ?? [];
      list.push(booking);
      map.set(booking.date, list);
    }
    return map;
  }, [data]);

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const goToMonth = (delta: number) => {
    setCursor((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const selectedDayBookings = selectedDay ? (bookingsByDate.get(selectedDay) ?? []) : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref={homeHref}
        breadcrumb={[roleLabel, "Appointments"]}
        title="Appointment Calendar"
        subtitle="Online service bookings across the schedule."
      />

      <FilterBar>
        {canPickBranch && (
          <BranchFilterSelect
            value={selectedBranch}
            onChange={(value) => setSelectedBranch(value)}
          />
        )}
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value as Booking["status"] | "")}
          containerClassName={FILTER_FIELD_WIDTH}
        >
          <option value="">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </FilterBar>

      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => goToMonth(-1)} aria-label="Previous month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="min-w-[160px] text-center text-sm font-semibold text-text-primary">
                {monthLabel}
              </h2>
              <Button variant="secondary" onClick={() => goToMonth(1)} aria-label="Next month">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                const now = new Date();
                setCursor({ year: now.getFullYear(), month: now.getMonth() });
              }}
            >
              Today
            </Button>
            <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={clsx("h-4 w-4", isFetching && "animate-spin")} />
              Refresh
            </Button>
          </div>

          {isLoading && <LoadingState label="Loading appointments…" />}
          {isError && <ErrorState onRetry={() => refetch()} />}

          {!isLoading && !isError && (
            <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="bg-background py-2 text-center text-xs font-medium text-text-secondary"
                >
                  {label}
                </div>
              ))}
              {grid.map((day) => {
                const iso = toISODate(day);
                const inMonth = day.getMonth() === cursor.month;
                const dayBookings = bookingsByDate.get(iso) ?? [];
                const overflow = dayBookings.length - MAX_VISIBLE_PER_DAY;

                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => dayBookings.length > 0 && setSelectedDay(iso)}
                    className={clsx(
                      "flex min-h-[92px] flex-col gap-1 bg-surface p-1.5 text-left align-top transition-colors",
                      !inMonth && "bg-background/60 text-text-secondary/50",
                      dayBookings.length > 0 && "cursor-pointer hover:bg-primary-light/40",
                    )}
                  >
                    <span
                      className={clsx(
                        "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                        iso === todayISO && "bg-primary font-semibold text-white",
                      )}
                    >
                      {day.getDate()}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      {dayBookings.slice(0, MAX_VISIBLE_PER_DAY).map((booking) => (
                        <span
                          key={booking.id}
                          className={clsx(
                            "truncate rounded px-1 py-0.5 text-[11px] leading-tight",
                            booking.status === "cancelled"
                              ? "bg-danger/10 text-danger line-through"
                              : "bg-info/10 text-info",
                          )}
                        >
                          {formatTimeLabel(booking.time)} · {booking.patientName}
                        </span>
                      ))}
                      {overflow > 0 && (
                        <span className="text-[11px] font-medium text-text-secondary">
                          +{overflow} more
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      <Modal
        open={selectedDay !== null}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ?? ""}
        description={`${selectedDayBookings.length} appointment${selectedDayBookings.length === 1 ? "" : "s"}`}
      >
        <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
          {selectedDayBookings.map((booking) => (
            <div
              key={booking.id}
              className="flex flex-col gap-1 rounded-lg border border-border p-3 text-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-text-primary">{booking.patientName}</span>
                <span
                  className={clsx(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    booking.status === "cancelled"
                      ? "bg-danger/10 text-danger"
                      : "bg-success/10 text-success",
                  )}
                >
                  {booking.status}
                </span>
              </div>
              <p className="text-text-secondary">
                {booking.serviceName} · {formatTimeLabel(booking.time)}
              </p>
              <p className="text-xs text-text-secondary">
                {booking.branchName} · Advance {formatCurrency(booking.advanceAmount)} ·{" "}
                {booking.bookingCode}
              </p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
