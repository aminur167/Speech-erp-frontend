"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import { LoadingState } from "@/components/ui/states";
import { useStaffAttendanceHistory } from "@/hooks/staff/useStaffAttendanceHistory";
import { ATTENDANCE_STATUS_TONE } from "@/components/staff/attendanceStatusTone";
import { humanizeField } from "@/utils/fields";
import type { AttendanceStatus } from "@/types/domain";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const LEGEND_STATUSES: AttendanceStatus[] = ["present", "early_leave", "on_leave", "absent"];
const GRID_WIDTH = "max-w-[210px]";

// Same tones as the attendance Badges elsewhere (ATTENDANCE_STATUS_TONE) —
// these two maps just translate a tone name into cell/dot CSS classes.
const TONE_CELL_CLASS: Record<"success" | "warning" | "info" | "danger", string> = {
  success: "bg-success/20 text-success ring-1 ring-inset ring-success/25",
  warning: "bg-warning/20 text-warning ring-1 ring-inset ring-warning/25",
  info: "bg-info/20 text-info ring-1 ring-inset ring-info/25",
  danger: "bg-danger/20 text-danger ring-1 ring-inset ring-danger/25",
};

const TONE_DOT_CLASS: Record<"success" | "warning" | "info" | "danger", string> = {
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  danger: "bg-danger",
};

function toISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** A month-at-a-glance attendance view — present days green, absent red, early leave amber, on leave blue. */
export function AttendanceCalendar({
  branchId,
  staffId,
  initialMonth,
}: {
  /** Admin only — a Manager is scoped to their own branch server-side. */
  branchId?: string;
  staffId: string;
  /** ISO "YYYY-MM" to open on — defaults to the current month. */
  initialMonth?: string;
}) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => {
    if (initialMonth) {
      const [y, m] = initialMonth.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth(); // 0-indexed
  const monthParam = `${year}-${String(month + 1).padStart(2, "0")}`;
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const { data: history, isLoading } = useStaffAttendanceHistory(branchId, staffId, monthParam);

  const recordsByDate = useMemo(() => {
    const map = new Map<string, NonNullable<typeof history>[number]>();
    (history ?? []).forEach((record) => map.set(record.date, record));
    return map;
  }, [history]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = new Date(year, month, 1).getDay();
  const todayISO = toISODate(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="rounded-xl border border-border bg-surface p-2.5 shadow-sm">
      <div className={clsx("mx-auto flex items-center justify-between", GRID_WIDTH)}>
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="flex h-6 w-6 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-primary-light hover:text-primary-dark"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <p className="text-xs font-bold text-text-primary">
          {cursor.toLocaleDateString(undefined, { year: "numeric", month: "long" })}
        </p>
        <button
          type="button"
          aria-label="Next month"
          disabled={isCurrentMonth}
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="flex h-6 w-6 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-primary-light hover:text-primary-dark disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {isLoading ? (
        <LoadingState label="Loading attendance…" />
      ) : (
        <>
          <div className={clsx("mx-auto mt-2 grid grid-cols-7 gap-1", GRID_WIDTH)}>
            {WEEKDAY_LABELS.map((label, i) => (
              <div
                key={`${label}-${i}`}
                className={clsx(
                  "text-center text-[10px] font-bold",
                  i === 0 || i === 6 ? "text-primary/50" : "text-text-secondary/70",
                )}
              >
                {label}
              </div>
            ))}
            {Array.from({ length: leadingBlanks }, (_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const iso = toISODate(year, month, day);
              const record = recordsByDate.get(iso);
              const isToday = iso === todayISO;
              const isWeekend = (leadingBlanks + i) % 7 === 0 || (leadingBlanks + i) % 7 === 6;
              const title = record
                ? [
                    humanizeField(record.status),
                    record.checkInAt &&
                      `${formatTime(record.checkInAt)}${record.checkOutAt ? ` – ${formatTime(record.checkOutAt)}` : ""}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : undefined;

              return (
                <div
                  key={iso}
                  title={title}
                  className={clsx(
                    "flex aspect-square items-center justify-center rounded-md text-[11px] font-semibold",
                    record
                      ? TONE_CELL_CLASS[ATTENDANCE_STATUS_TONE[record.status]]
                      : isToday
                        ? "bg-primary text-white"
                        : clsx(
                            "font-medium",
                            isWeekend ? "bg-background text-text-secondary/50" : "text-text-secondary/40",
                          ),
                    isToday && record && "ring-2 ring-primary ring-offset-1 ring-offset-surface",
                  )}
                >
                  {day}
                </div>
              );
            })}
          </div>

          <div className={clsx("mx-auto mt-2.5 flex flex-wrap justify-center gap-x-2.5 gap-y-1 border-t border-border pt-2", GRID_WIDTH)}>
            {LEGEND_STATUSES.map((status) => (
              <span key={status} className="flex items-center gap-1 text-[10px] font-medium text-text-secondary">
                <span className={clsx("h-1.5 w-1.5 rounded-full", TONE_DOT_CLASS[ATTENDANCE_STATUS_TONE[status]])} />
                {humanizeField(status)}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
