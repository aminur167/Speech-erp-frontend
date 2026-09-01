"use client";

import { clsx } from "clsx";
import { PatientAvatar, StatusDot, toISODate } from "@/components/enrollments/calendar/shared";
import { formatTimeLabel } from "@/utils/time";
import type { Booking } from "@/types/domain";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
  const todayISO = toISODate(new Date());

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {days.map((day, i) => {
        const iso = toISODate(day);
        const isToday = iso === todayISO;
        const dayBookings = (bookingsByDate.get(iso) ?? []).sort((a, b) =>
          a.time.localeCompare(b.time),
        );

        return (
          <div
            key={iso}
            className={clsx(
              "flex flex-col gap-2 rounded-lg border p-2",
              isToday ? "border-primary/40 bg-primary-light/20" : "border-border/60 bg-surface",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">
                {WEEKDAY_LABELS[i]}
              </span>
              <span
                className={clsx(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                  isToday ? "bg-primary font-semibold text-white" : "text-text-primary",
                )}
              >
                {day.getDate()}
              </span>
            </div>
            <div className="flex min-h-[60px] flex-col gap-1.5">
              {dayBookings.length === 0 && (
                <p className="py-4 text-center text-[11px] text-text-secondary/60">
                  No appointments
                </p>
              )}
              {dayBookings.map((booking) => (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() => onSelectDay(iso)}
                  className={clsx(
                    "flex items-center gap-1.5 rounded-md border p-1.5 text-left text-xs transition-colors",
                    booking.status === "cancelled"
                      ? "border-danger/20 bg-danger/5"
                      : "border-info/20 bg-info/5 hover:border-info/40",
                  )}
                >
                  <PatientAvatar name={booking.patientName} />
                  <div className="min-w-0">
                    <p
                      className={clsx(
                        "truncate font-medium",
                        booking.status === "cancelled"
                          ? "text-text-secondary line-through"
                          : "text-text-primary",
                      )}
                    >
                      {booking.patientName}
                    </p>
                    <p className="flex items-center gap-1 truncate text-[10px] text-text-secondary">
                      <StatusDot status={booking.status} />
                      {formatTimeLabel(booking.time)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
