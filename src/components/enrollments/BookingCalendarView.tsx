"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Search,
  Calendar,
  Rows3,
  ListTodo,
} from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ErrorState } from "@/components/ui/states";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { BranchFilterSelect } from "@/components/ui/BranchFilterSelect";
import { FilterBar, FILTER_FIELD_WIDTH } from "@/components/ui/FilterBar";
import { CancelBookingModal } from "@/components/enrollments/CancelBookingModal";
import { DayDetailModal } from "@/components/enrollments/calendar/DayDetailModal";
import { MonthGrid, MonthGridSkeleton, buildCalendarGrid } from "@/components/enrollments/calendar/MonthGrid";
import { WeekView, buildWeekGrid } from "@/components/enrollments/calendar/WeekView";
import { AgendaView } from "@/components/enrollments/calendar/AgendaView";
import { toISODate } from "@/components/enrollments/calendar/shared";
import { useBookings } from "@/hooks/enrollments/useBookings";
import { useAuthStore } from "@/store/authStore";
import type { Booking } from "@/types/domain";

type View = "month" | "week" | "agenda";

const AGENDA_WINDOW_DAYS = 60;

const VIEW_OPTIONS: { value: View; label: string; icon: typeof Calendar }[] = [
  { value: "month", label: "Month", icon: Calendar },
  { value: "week", label: "Week", icon: Rows3 },
  { value: "agenda", label: "Agenda", icon: ListTodo },
];

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
  const isManager = user?.role === "manager";
  const canPickBranch = isAdmin && !branchIdOverride;

  const [selectedBranch, setSelectedBranch] = useState("");
  const branchId =
    branchIdOverride ??
    (user?.role === "manager" ? (user.branchId ?? undefined) : selectedBranch || undefined);

  const [view, setView] = useState<View>("month");
  const [status, setStatus] = useState<Booking["status"] | "">("");
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);

  const grid = useMemo(() => buildCalendarGrid(cursor.year, cursor.month), [cursor]);
  const weekDays = useMemo(() => buildWeekGrid(weekAnchor), [weekAnchor]);
  const todayISO = toISODate(new Date());

  const { dateFrom, dateTo } = useMemo(() => {
    if (view === "month") {
      return { dateFrom: toISODate(grid[0]), dateTo: toISODate(grid[grid.length - 1]) };
    }
    if (view === "week") {
      return { dateFrom: toISODate(weekDays[0]), dateTo: toISODate(weekDays[6]) };
    }
    const end = new Date();
    end.setDate(end.getDate() + AGENDA_WINDOW_DAYS);
    return { dateFrom: todayISO, dateTo: toISODate(end) };
  }, [view, grid, weekDays, todayISO]);

  const { data, isLoading, isFetching, isError, refetch } = useBookings({
    dateFrom,
    dateTo,
    status: status || undefined,
    branchId,
  });

  const visibleBookings = useMemo(() => {
    const all = data?.results ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return all;
    return all.filter(
      (booking) =>
        booking.patientName.toLowerCase().includes(term) ||
        booking.bookingCode.toLowerCase().includes(term),
    );
  }, [data, search]);

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const booking of visibleBookings) {
      const list = map.get(booking.date) ?? [];
      list.push(booking);
      map.set(booking.date, list);
    }
    return map;
  }, [visibleBookings]);

  const stats = useMemo(
    () => ({
      total: visibleBookings.length,
      confirmed: visibleBookings.filter((b) => b.status === "confirmed").length,
      cancelled: visibleBookings.filter((b) => b.status === "cancelled").length,
      today: (bookingsByDate.get(todayISO) ?? []).length,
    }),
    [visibleBookings, bookingsByDate, todayISO],
  );

  const rangeLabel = useMemo(() => {
    if (view === "month") {
      return new Date(cursor.year, cursor.month, 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }
    if (view === "week") {
      const start = weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const end = weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return `${start} – ${end}`;
    }
    return `Next ${AGENDA_WINDOW_DAYS} days`;
  }, [view, cursor, weekDays]);

  const goToMonth = (delta: number) => {
    setCursor((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const goToWeek = (delta: number) => {
    setWeekAnchor((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta * 7);
      return d;
    });
  };

  const goToToday = () => {
    const now = new Date();
    setCursor({ year: now.getFullYear(), month: now.getMonth() });
    setWeekAnchor(now);
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today" value={String(stats.today)} icon={CalendarDays} tone="info" />
        <StatCard label="In View" value={String(stats.total)} icon={CalendarDays} tone="primary" />
        <StatCard
          label="Confirmed"
          value={String(stats.confirmed)}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard label="Cancelled" value={String(stats.cancelled)} icon={XCircle} tone="danger" />
      </div>

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
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search patient or booking code…"
            className="pl-8"
          />
        </div>
      </FilterBar>

      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {view !== "agenda" && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => (view === "month" ? goToMonth(-1) : goToWeek(-1))}
                    aria-label="Previous"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="min-w-[170px] text-center text-sm font-semibold text-text-primary">
                    {rangeLabel}
                  </h2>
                  <Button
                    variant="secondary"
                    onClick={() => (view === "month" ? goToMonth(1) : goToWeek(1))}
                    aria-label="Next"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              {view === "agenda" && (
                <h2 className="text-sm font-semibold text-text-primary">{rangeLabel}</h2>
              )}
            </div>

            {/* Segmented view switcher — the Month/Week/Agenda pattern from Google Calendar/Cal.com. */}
            <div className="flex rounded-lg border border-border bg-background p-0.5">
              {VIEW_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = view === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setView(option.value)}
                    className={clsx(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "bg-surface text-primary shadow-sm"
                        : "text-text-secondary hover:text-text-primary",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              {view !== "agenda" && (
                <Button variant="secondary" onClick={goToToday}>
                  Today
                </Button>
              )}
              <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={clsx("h-4 w-4", isFetching && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>

          {!isLoading && (
            <div className="flex items-center gap-3 text-xs text-text-secondary">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-info" /> Confirmed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-danger" /> Cancelled
              </span>
            </div>
          )}

          {isLoading && view === "month" && <MonthGridSkeleton />}
          {isLoading && view !== "month" && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-background" />
              ))}
            </div>
          )}
          {isError && <ErrorState onRetry={() => refetch()} />}

          {!isLoading && !isError && view === "month" && (
            <MonthGrid
              grid={grid}
              month={cursor.month}
              bookingsByDate={bookingsByDate}
              onSelectDay={setSelectedDay}
            />
          )}
          {!isLoading && !isError && view === "week" && (
            <WeekView days={weekDays} bookingsByDate={bookingsByDate} onSelectDay={setSelectedDay} />
          )}
          {!isLoading && !isError && view === "agenda" && (
            <AgendaView
              bookings={visibleBookings}
              isManager={isManager}
              onCancel={setCancellingBooking}
            />
          )}
        </div>
      </Card>

      <DayDetailModal
        date={selectedDay}
        bookings={selectedDayBookings}
        isManager={isManager}
        onClose={() => setSelectedDay(null)}
        onCancel={setCancellingBooking}
      />

      <CancelBookingModal booking={cancellingBooking} onClose={() => setCancellingBooking(null)} />
    </div>
  );
}
