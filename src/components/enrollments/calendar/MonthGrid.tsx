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
    <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border/60 bg-border/60">
      {Array.from({ length: 42 }, (_, i) => (
        <div key={i} className="min-h-[104px] animate-pulse bg-surface" />
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
    <div className="overflow-hidden rounded-lg border border-border/60">
      <div className="grid grid-cols-7 border-b border-border/60 bg-background/50">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={clsx(
              "py-2 text-center text-[11px] font-semibold tracking-wide uppercase",
              i === 0 || i === 6 ? "text-primary/50" : "text-text-secondary",
            )}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-border/60">
        {grid.map((day) => {
          const iso = toISODate(day);
          const inMonth = day.getMonth() === month;
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
                "flex min-h-[104px] flex-col gap-1 p-1.5 text-left transition-colors",
                inMonth ? "bg-surface" : "bg-background/40",
                inMonth && isWeekend && "bg-primary-light/5",
                dayBookings.length > 0 && "cursor-pointer hover:bg-primary-light/25",
              )}
            >
              <span
                className={clsx(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                  isToday ? "bg-primary font-semibold text-white" : "font-medium text-text-primary",
                  !inMonth && "text-text-secondary/40",
                )}
              >
                {day.getDate()}
              </span>
              <div className="flex flex-col gap-0.5">
                {dayBookings.slice(0, MAX_VISIBLE_PER_DAY).map((booking) => (
                  <div
                    key={booking.id}
                    className={clsx(
                      "flex items-center gap-1 truncate rounded px-1 py-0.5 text-[11px] font-medium leading-tight",
                      booking.status === "cancelled"
                        ? "text-text-secondary line-through"
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
                  <span className="px-1 text-[11px] font-medium text-text-secondary hover:text-primary">
                    {overflow} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
