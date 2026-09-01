"use client";

import { useMemo } from "react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/states";
import { PatientAvatar } from "@/components/enrollments/calendar/shared";
import { formatCurrency } from "@/utils/currency";
import { formatTimeLabel } from "@/utils/time";
import type { Booking } from "@/types/domain";

function dateGroupLabel(iso: string, todayISO: string): string {
  const date = new Date(`${iso}T00:00:00`);
  const tomorrow = new Date(`${todayISO}T00:00:00`);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (iso === todayISO) return "Today";
  if (iso === toISO(tomorrow)) return "Tomorrow";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AgendaView({
  bookings,
  isManager,
  onCancel,
}: {
  bookings: Booking[];
  isManager: boolean;
  onCancel: (booking: Booking) => void;
}) {
  const todayISO = toISO(new Date());

  const groups = useMemo(() => {
    const sorted = [...bookings].sort((a, b) =>
      a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date),
    );
    const map = new Map<string, Booking[]>();
    for (const booking of sorted) {
      const list = map.get(booking.date) ?? [];
      list.push(booking);
      map.set(booking.date, list);
    }
    return Array.from(map.entries());
  }, [bookings]);

  if (groups.length === 0) {
    return <EmptyState label="No appointments in this range." />;
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map(([date, dayBookings]) => (
        <div key={date} className="flex flex-col gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            {dateGroupLabel(date, todayISO)}
            <span className="font-normal text-text-secondary">
              {new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </h3>
          <div className="flex flex-col gap-2">
            {dayBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3 text-sm transition-colors hover:border-primary/30"
              >
                <PatientAvatar name={booking.patientName} size="md" />
                <div className="min-w-[140px] flex-1">
                  <p
                    className={clsx(
                      "font-medium",
                      booking.status === "cancelled"
                        ? "text-text-secondary line-through"
                        : "text-text-primary",
                    )}
                  >
                    {booking.patientName}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {booking.serviceName} · {booking.branchName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-text-primary">
                    {formatTimeLabel(booking.time)}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {formatCurrency(booking.advanceAmount)}
                  </p>
                </div>
                <Badge
                  tone={booking.status === "cancelled" ? "danger" : "success"}
                  label={booking.status}
                />
                {isManager && booking.status === "confirmed" && (
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => onCancel(booking)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
