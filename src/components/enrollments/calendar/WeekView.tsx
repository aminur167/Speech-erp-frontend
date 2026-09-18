"use client";

import { clsx } from "clsx";
import { toISODate } from "@/components/enrollments/calendar/shared";
import { formatTimeLabel } from "@/utils/time";
import type { Booking } from "@/types/domain";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Matches the clinic's real booking window (BOOKING_WINDOW_START_HOUR/END_HOUR
// in the backend) -- the whole point of an hour grid here is every slot a
// patient could actually be booked into, not the 24 Google Calendar shows
// for a life that runs around the clock.
const WINDOW_START_HOUR = 10;
const WINDOW_END_HOUR = 18;
const HOUR_HEIGHT = 56;
// A booking has no stored end time -- BOOKING_SLOT_MINUTES worth of block
// height is what the public site's own availability picker treats as one
// slot, so a booked block reads as "this slot", not an invented duration.
const SLOT_MINUTES = 30;

const HOURS = Array.from(
  { length: WINDOW_END_HOUR - WINDOW_START_HOUR + 1 },
  (_, i) => WINDOW_START_HOUR + i,
);
const GRID_HEIGHT = (WINDOW_END_HOUR - WINDOW_START_HOUR) * HOUR_HEIGHT;

function hourLabel(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour} ${period}`;
}

function minutesFromWindowStart(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h - WINDOW_START_HOUR) * 60 + m;
}

export function buildWeekGrid(anchor: Date): Date[] {
  const start = new Date(anchor);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function WeekView({
  days,
  bookingsByDate,
  onSelectDay,
}: {
  days: Date[];
  bookingsByDate: Map<string, Booking[]>;
  onSelectDay: (iso: string) => void;
}) {
  const now = new Date();
  const todayISO = toISODate(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowOffset = ((nowMinutes - WINDOW_START_HOUR * 60) / ((WINDOW_END_HOUR - WINDOW_START_HOUR) * 60)) * 100;
  const showNowLine = nowMinutes >= WINDOW_START_HOUR * 60 && nowMinutes <= WINDOW_END_HOUR * 60;

  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      {/* Day headers, aligned with the time gutter below. */}
      <div className="grid grid-cols-[52px_repeat(7,1fr)] border-b border-border/60 bg-background/50">
        <div />
        {days.map((day, i) => {
          const iso = toISODate(day);
          const isToday = iso === todayISO;
          const isWeekend = i === 0 || i === 6;
          return (
            <div key={iso} className="flex flex-col items-center gap-1 py-2">
              <span
                className={clsx(
                  "text-[11px] font-semibold tracking-wide uppercase",
                  isWeekend ? "text-primary/50" : "text-text-secondary",
                )}
              >
                {WEEKDAY_LABELS[i]}
              </span>
              <span
                className={clsx(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                  isToday ? "bg-primary font-semibold text-white" : "font-medium text-text-primary",
                )}
              >
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Hour grid — a real time axis, the way Google Calendar's week view reads. */}
      <div className="grid grid-cols-[52px_repeat(7,1fr)]">
        <div className="relative" style={{ height: GRID_HEIGHT }}>
          {HOURS.slice(0, -1).map((hour, i) => (
            <span
              key={hour}
              className="absolute right-1.5 -translate-y-1/2 text-[10px] text-text-secondary"
              style={{ top: i * HOUR_HEIGHT + HOUR_HEIGHT }}
            >
              {hourLabel(hour)}
            </span>
          ))}
        </div>

        {days.map((day, dayIndex) => {
          const iso = toISODate(day);
          const isToday = iso === todayISO;
          const dayBookings = bookingsByDate.get(iso) ?? [];

          const byTime = new Map<string, Booking[]>();
          for (const booking of dayBookings) {
            const list = byTime.get(booking.time) ?? [];
            list.push(booking);
            byTime.set(booking.time, list);
          }

          return (
            <div
              key={iso}
              className={clsx(
                "relative border-l border-border/60",
                isToday ? "bg-primary-light/10" : dayIndex % 6 === 0 ? "bg-primary-light/5" : "",
              )}
              style={{ height: GRID_HEIGHT }}
            >
              {HOURS.slice(0, -1).map((hour, i) => (
                <div
                  key={hour}
                  className="absolute right-0 left-0 border-t border-border/40"
                  style={{ top: (i + 1) * HOUR_HEIGHT }}
                />
              ))}

              {isToday && showNowLine && (
                <div
                  className="absolute right-0 left-0 z-10 flex items-center"
                  style={{ top: `${nowOffset}%` }}
                >
                  <span className="-ml-1 h-2 w-2 rounded-full bg-danger" />
                  <span className="h-px flex-1 bg-danger" />
                </div>
              )}

              {Array.from(byTime.entries()).map(([time, bookings]) => {
                const top = (minutesFromWindowStart(time) / 60) * HOUR_HEIGHT;
                const height = (SLOT_MINUTES / 60) * HOUR_HEIGHT;
                return bookings.map((booking, i) => (
                  <button
                    key={booking.id}
                    type="button"
                    onClick={() => onSelectDay(iso)}
                    className={clsx(
                      "absolute overflow-hidden rounded-md border-l-2 px-1.5 py-0.5 text-left text-[11px] leading-tight shadow-sm transition-colors",
                      booking.status === "cancelled"
                        ? "border-l-danger bg-danger/10 text-text-secondary line-through"
                        : !booking.advancePaid
                          ? "border-l-warning bg-warning/15 text-warning hover:bg-warning/25"
                          : "border-l-info bg-info/15 text-info hover:bg-info/25",
                    )}
                    style={{
                      top,
                      height: Math.max(height, 20),
                      left: `${(i / bookings.length) * 100}%`,
                      width: `${100 / bookings.length}%`,
                    }}
                  >
                    <p className="truncate font-semibold">{formatTimeLabel(time)}</p>
                    <p className="truncate">{booking.patientName}</p>
                  </button>
                ));
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
