"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PatientAvatar } from "@/components/enrollments/calendar/shared";
import { formatCurrency } from "@/utils/currency";
import { formatTimeLabel } from "@/utils/time";
import type { Booking } from "@/types/domain";

export function DayDetailModal({
  date,
  bookings,
  isManager,
  onClose,
  onCancel,
}: {
  date: string | null;
  bookings: Booking[];
  isManager: boolean;
  onClose: () => void;
  onCancel: (booking: Booking) => void;
}) {
  const label = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <Modal
      open={date !== null}
      onClose={onClose}
      title={label}
      description={`${bookings.length} appointment${bookings.length === 1 ? "" : "s"}`}
    >
      <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
        {[...bookings]
          .sort((a, b) => a.time.localeCompare(b.time))
          .map((booking) => (
            <div
              key={booking.id}
              className="flex flex-col gap-2 rounded-xl border border-border p-3 text-sm transition-colors hover:border-primary/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <PatientAvatar name={booking.patientName} />
                  <div>
                    <p className="font-medium text-text-primary">{booking.patientName}</p>
                    <p className="text-xs text-text-secondary">
                      {booking.serviceName} · {formatTimeLabel(booking.time)}
                    </p>
                  </div>
                </div>
                <Badge
                  tone={booking.status === "cancelled" ? "danger" : "success"}
                  label={booking.status}
                />
              </div>
              <p className="pl-9 text-xs text-text-secondary">
                {booking.branchName} · Advance {formatCurrency(booking.advanceAmount)} ·{" "}
                {booking.bookingCode}
              </p>
              {isManager && booking.status === "confirmed" && (
                <div className="flex justify-end pl-9">
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => onCancel(booking)}
                  >
                    Cancel Appointment
                  </Button>
                </div>
              )}
            </div>
          ))}
      </div>
    </Modal>
  );
}
