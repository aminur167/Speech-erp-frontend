"use client";

import { clsx } from "clsx";
import { StatusDot, toISODate } from "@/components/enrollments/calendar/shared";
import { formatTimeLabel } from "@/utils/time";
import type { Booking } from "@/types/domain";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_VISIBLE_PER_DAY = 3;

/** The 6-row grid a month calendar needs, including the leading/trailing days of neighboring months. */
export function buildCalendarGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const start = new Date(firstOfMonth);
  start.setDate(start.getDate() - firstOfMonth.getDay());

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function MonthGridSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: 35 }, (_, i) => (
        <div key={i} className="min-h-[104px] animate-pulse rounded-xl bg-background" />
      ))}
    </div>
  );
}

export function MonthGrid({
  grid,
  month,
  bookingsByDate,
  onSelectDay,
}: {
  grid: Date[];
  month: number;
  bookingsByDate: Map<string, Booking[]>;
  onSelectDay: (iso: string) => void;
}) {
  const todayISO = toISODate(new Date());

  return (
    <div className="grid grid-cols-7 gap-2">
      {WEEKDAY_LABELS.map((label, i) => (
        <div
          key={label}
          className={clsx(
            "pb-2 text-center text-[11px] font-bold tracking-wider uppercase",
            i === 0 || i === 6 ? "text-primary/60" : "text-text-secondary",
          )}
        >
          {label}
        </div>
      ))}
      {grid.map((day) => {
        const iso = toISODate(day);
        const inMonth = day.getMonth() === month;
        const isPast = iso < todayISO;
        const isToday = iso === todayISO;
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
        const dayBookings = (bookingsByDate.get(iso) ?? []).sort((a, b) =>
          a.time.localeCompare(b.time),
        );
        const overflow = dayBookings.length - MAX_VISIBLE_PER_DAY;

        return (
          <button
            key={iso}
            type="button"
            onClick={() => dayBookings.length > 0 && onSelectDay(iso)}
            className={clsx(
              "group flex min-h-[104px] flex-col gap-1.5 rounded-xl border p-2 text-left transition-all duration-150",
              isToday
                ? "border-primary bg-gradient-to-br from-primary-light/60 to-primary-light/10 shadow-sm ring-1 ring-primary/30"
                : "border-border/60 bg-surface",
              !inMonth && "border-transparent bg-transparent opacity-30",
              inMonth && isPast && !isToday && "bg-background/40",
              inMonth && isWeekend && !isToday && "bg-primary-light/10",
              dayBookings.length > 0 &&
                "cursor-pointer hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md",
            )}
          >
            <span
              className={clsx(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs transition-colors",
                isToday
                  ? "bg-gradient-to-br from-primary to-primary-dark font-bold text-white shadow-sm"
                  : "font-medium text-text-primary group-hover:bg-primary-light/60",
                !inMonth && "text-text-secondary/50",
              )}
            >
              {day.getDate()}
            </span>
            <div className="flex flex-col gap-1">
              {dayBookings.slice(0, MAX_VISIBLE_PER_DAY).map((booking) => (
                <div
                  key={booking.id}
                  className={clsx(
                    "flex items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-tight transition-colors",
                    booking.status === "cancelled"
                      ? "bg-danger/10 text-text-secondary line-through"
                      : !booking.advancePaid
                        ? "bg-warning/15 text-warning"
                        : "bg-info/15 text-info",
                  )}
                >
                  <StatusDot booking={booking} />
                  <span className="truncate">
                    {formatTimeLabel(booking.time)} · {booking.patientName}
                  </span>
                </div>
              ))}
              {overflow > 0 && (
                <span className="rounded-md bg-primary-light/50 px-1.5 py-0.5 text-[11px] font-semibold text-primary-dark">
                  +{overflow} more
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
