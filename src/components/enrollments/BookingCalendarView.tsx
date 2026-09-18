"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  Search,
  Calendar,
  Rows3,
  ListTodo,
} from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorState } from "@/components/ui/states";
import { PageHeader } from "@/components/layout/PageHeader";
import { BranchFilterSelect } from "@/components/ui/BranchFilterSelect";
import { CancelBookingModal } from "@/components/enrollments/CancelBookingModal";
import { CollectAdvanceModal } from "@/components/enrollments/CollectAdvanceModal";
import { DayDetailModal } from "@/components/enrollments/calendar/DayDetailModal";
import { MiniMonthCalendar } from "@/components/enrollments/calendar/MiniMonthCalendar";
import { MonthGrid, MonthGridSkeleton, buildCalendarGrid } from "@/components/enrollments/calendar/MonthGrid";
import { WeekView, buildWeekGrid } from "@/components/enrollments/calendar/WeekView";
import { AgendaView } from "@/components/enrollments/calendar/AgendaView";
import { toISODate } from "@/components/enrollments/calendar/shared";
import { useBookings } from "@/hooks/enrollments/useBookings";
import { useAuthStore } from "@/store/authStore";
import type { Booking } from "@/types/domain";

type View = "month" | "week" | "agenda";
type Category = "confirmed" | "pending" | "cancelled";

const AGENDA_WINDOW_DAYS = 60;

const VIEW_OPTIONS: { value: View; label: string; icon: typeof Calendar }[] = [
  { value: "month", label: "Month", icon: Calendar },
  { value: "week", label: "Week", icon: Rows3 },
  { value: "agenda", label: "Schedule", icon: ListTodo },
];

const CATEGORY_META: Record<Category, { label: string; dot: string }> = {
  confirmed: { label: "Confirmed", dot: "bg-info" },
  pending: { label: "Payment Pending", dot: "bg-warning" },
  cancelled: { label: "Cancelled", dot: "bg-danger" },
};

function categoryOf(booking: Booking): Category {
  if (booking.status === "cancelled") return "cancelled";
  return booking.advancePaid ? "confirmed" : "pending";
}

/**
 * Google Calendar's own chrome: a sidebar with a mini date picker and a
 * "My calendars"-style visibility checklist next to a main month/week/
 * schedule grid, rather than a single toolbar-plus-table.
 */
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
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";
  const canPickBranch = isAdmin && !branchIdOverride;

  const [selectedBranch, setSelectedBranch] = useState("");
  const branchId =
    branchIdOverride ??
    (user?.role === "manager" ? (user.branchId ?? undefined) : selectedBranch || undefined);

  const [view, setView] = useState<View>("month");
  const [visibleCategories, setVisibleCategories] = useState<Set<Category>>(
    () => new Set(["confirmed", "pending", "cancelled"]),
  );
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [collectingBooking, setCollectingBooking] = useState<Booking | null>(null);

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
    branchId,
  });

  const visibleBookings = useMemo(() => {
    const all = data?.results ?? [];
    const term = search.trim().toLowerCase();
    return all.filter((booking) => {
      if (!visibleCategories.has(categoryOf(booking))) return false;
      if (!term) return true;
      return (
        booking.patientName.toLowerCase().includes(term) ||
        booking.bookingCode.toLowerCase().includes(term)
      );
    });
  }, [data, search, visibleCategories]);

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const booking of visibleBookings) {
      const list = map.get(booking.date) ?? [];
      list.push(booking);
      map.set(booking.date, list);
    }
    return map;
  }, [visibleBookings]);

  const categoryCounts = useMemo(() => {
    const all = data?.results ?? [];
    const counts: Record<Category, number> = { confirmed: 0, pending: 0, cancelled: 0 };
    for (const booking of all) counts[categoryOf(booking)] += 1;
    return counts;
  }, [data]);

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

  /** The mini calendar and the main day grid both land here — one place keeps every view of "which day" in sync. */
  const jumpToDate = (iso: string) => {
    const d = new Date(`${iso}T00:00:00`);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
    setWeekAnchor(d);
    setSelectedDay(iso);
  };

  const toggleCategory = (category: Category) => {
    setVisibleCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
        {/* Sidebar — a mini date picker plus a "my calendars"-style visibility
            toggle, the two things that make Google Calendar's own chrome
            recognizable at a glance. */}
        <div className="flex flex-col gap-5">
          {isManager && (
            <Button
              onClick={() => router.push("/manager/services/online")}
              className="w-full !justify-start !gap-3 !rounded-full !py-2.5 !pl-3.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              New Booking
            </Button>
          )}

          <Card padding="sm" className="!p-3">
            <MiniMonthCalendar
              year={cursor.year}
              month={cursor.month}
              onNavigate={(year, month) => setCursor({ year, month })}
              selectedDate={selectedDay}
              onSelectDate={jumpToDate}
            />
          </Card>

          {canPickBranch && (
            <BranchFilterSelect value={selectedBranch} onChange={(value) => setSelectedBranch(value)} />
          )}

          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search patient or code…"
              className="pl-8"
            />
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold tracking-wide text-text-secondary uppercase">
              My Calendars
            </h3>
            {(Object.keys(CATEGORY_META) as Category[]).map((category) => {
              const meta = CATEGORY_META[category];
              const checked = visibleCategories.has(category);
              return (
                <label
                  key={category}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1 text-sm transition-colors hover:bg-primary-light/40"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(category)}
                    className="sr-only"
                  />
                  <span
                    className={clsx(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded",
                      checked ? meta.dot : "border-2 border-border",
                    )}
                  >
                    {checked && (
                      <svg viewBox="0 0 16 16" className="h-3 w-3 fill-white">
                        <path d="M13.6 4.2 6.4 11.4 2.9 7.9l1-1 2.5 2.5 6.2-6.2z" />
                      </svg>
                    )}
                  </span>
                  <span className={clsx("flex-1", checked ? "text-text-primary" : "text-text-secondary")}>
                    {meta.label}
                  </span>
                  <span className="text-xs text-text-secondary">{categoryCounts[category]}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Main calendar. */}
        <Card padding="none" className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-4">
            <div className="flex items-center gap-1">
              <Button variant="secondary" onClick={goToToday} className="!rounded-full">
                Today
              </Button>
              {view !== "agenda" && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => (view === "month" ? goToMonth(-1) : goToWeek(-1))}
                    aria-label="Previous"
                    className="!rounded-full !border-none !p-2 !shadow-none"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => (view === "month" ? goToMonth(1) : goToWeek(1))}
                    aria-label="Next"
                    className="!rounded-full !border-none !p-2 !shadow-none"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              <h2 className="ml-1 text-lg font-medium text-text-primary">{rangeLabel}</h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Segmented view switcher — the Month/Week/Schedule pattern from Google Calendar. */}
              <div className="flex rounded-full border border-border bg-background p-0.5">
                {VIEW_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const active = view === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setView(option.value)}
                      className={clsx(
                        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
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
              <Button
                variant="secondary"
                onClick={() => refetch()}
                disabled={isFetching}
                aria-label="Refresh"
                className="!rounded-full !p-2"
              >
                <RefreshCw className={clsx("h-4 w-4", isFetching && "animate-spin")} />
              </Button>
            </div>
          </div>

          <div className="p-4">
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
                onCollectAdvance={setCollectingBooking}
              />
            )}
          </div>
        </Card>
      </div>

      <DayDetailModal
        date={selectedDay}
        bookings={selectedDayBookings}
        isManager={isManager}
        onClose={() => setSelectedDay(null)}
        onCancel={setCancellingBooking}
        onCollectAdvance={setCollectingBooking}
      />

      <CancelBookingModal booking={cancellingBooking} onClose={() => setCancellingBooking(null)} />
      <CollectAdvanceModal booking={collectingBooking} onClose={() => setCollectingBooking(null)} />
    </div>
  );
}
