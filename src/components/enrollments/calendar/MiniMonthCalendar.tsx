"use client";

import { clsx } from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toISODate } from "@/components/enrollments/calendar/shared";

const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * The small date-picker calendar in the sidebar, the way Google Calendar's
 * own works: independent of whatever the main view (month/week/agenda) is
 * showing, it just jumps the page to a date when clicked.
 */
export function MiniMonthCalendar({
  year,
  month,
  onNavigate,
  selectedDate,
  onSelectDate,
}: {
  year: number;
  month: number;
  onNavigate: (year: number, month: number) => void;
  selectedDate: string | null;
  onSelectDate: (iso: string) => void;
}) {
  const todayISO = toISODate(new Date());
  const firstOfMonth = new Date(year, month, 1);
  const start = new Date(firstOfMonth);
  start.setDate(start.getDate() - firstOfMonth.getDay());
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  const goTo = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    onNavigate(d.getFullYear(), d.getMonth());
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-0.5">
        <span className="text-sm font-semibold text-text-primary">
          {new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
        <div className="flex gap-0.5">
          <button
            type="button"
            onClick={() => goTo(-1)}
            aria-label="Previous month"
            className="rounded-full p-1 text-text-secondary transition-colors hover:bg-primary-light/60"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => goTo(1)}
            aria-label="Next month"
            className="rounded-full p-1 text-text-secondary transition-colors hover:bg-primary-light/60"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_INITIALS.map((label, i) => (
          <span key={i} className="text-[10px] font-medium text-text-secondary/60">
            {label}
          </span>
        ))}
        {days.map((day) => {
          const iso = toISODate(day);
          const inMonth = day.getMonth() === month;
          const isToday = iso === todayISO;
          const isSelected = iso === selectedDate;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDate(iso)}
              className={clsx(
                "mx-auto flex h-6 w-6 items-center justify-center rounded-full text-[11px] transition-colors",
                !inMonth && "text-text-secondary/30",
                inMonth &&
                  !isToday &&
                  !isSelected &&
                  "text-text-primary hover:bg-primary-light/60",
                isToday && !isSelected && "bg-primary-light font-semibold text-primary-dark",
                isSelected && "bg-primary font-semibold text-white",
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
