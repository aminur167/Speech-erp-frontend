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
    <div className="grid grid-cols-7 gap-1.5">
      {Array.from({ length: 35 }, (_, i) => (
        <div key={i} className="min-h-[100px] animate-pulse rounded-lg bg-background" />
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
    <div className="grid grid-cols-7 gap-1.5">
      {WEEKDAY_LABELS.map((label, i) => (
        <div
          key={label}
          className={clsx(
            "pb-1 text-center text-xs font-semibold tracking-wide text-text-secondary",
            (i === 0 || i === 6) && "text-text-secondary/70",
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
              "flex min-h-[100px] flex-col gap-1 rounded-lg border p-1.5 text-left transition-all",
              isToday
                ? "border-primary/40 bg-primary-light/30 ring-1 ring-primary/30"
                : "border-border/60 bg-surface",
              !inMonth && "border-transparent bg-transparent opacity-40",
              inMonth && isPast && !isToday && "bg-background/40",
              inMonth && isWeekend && !isToday && "bg-background/60",
              dayBookings.length > 0 && "cursor-pointer hover:border-primary/40 hover:shadow-sm",
            )}
          >
            <span
              className={clsx(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                isToday ? "bg-primary font-semibold text-white" : "text-text-primary",
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
                    "flex items-center gap-1 truncate rounded px-1 py-0.5 text-[11px] leading-tight",
                    booking.status === "cancelled"
                      ? "bg-danger/5 text-text-secondary line-through"
                      : "bg-info/10 text-info",
                  )}
                >
                  <StatusDot status={booking.status} />
                  <span className="truncate">
                    {formatTimeLabel(booking.time)} · {booking.patientName}
                  </span>
                </div>
              ))}
              {overflow > 0 && (
                <span className="px-1 text-[11px] font-medium text-text-secondary">
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
