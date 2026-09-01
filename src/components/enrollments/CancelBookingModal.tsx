"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useCancelBooking } from "@/hooks/enrollments/useCancelBooking";
import { formatTimeLabel } from "@/utils/time";
import type { ApiError } from "@/types/api";
import type { Booking } from "@/types/domain";

export function CancelBookingModal({
  booking,
  onClose,
}: {
  booking: Booking | null;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | undefined>();
  const cancelBooking = useCancelBooking();

  const handleClose = () => {
    setReason("");
    setError(undefined);
    cancelBooking.reset();
    onClose();
  };

  const handleConfirm = () => {
    if (!booking) return;
    cancelBooking.mutate(
      { bookingId: booking.id, reason: reason.trim() || undefined },
      {
        onSuccess: handleClose,
        onError: (apiError: ApiError) => setError(apiError.message),
      },
    );
  };

  return (
    <Modal
      open={Boolean(booking)}
      onClose={handleClose}
      title="Cancel Appointment"
      description={
        booking
          ? `${booking.patientName} — ${booking.serviceName} on ${booking.date} at ${formatTimeLabel(booking.time)}.`
          : undefined
      }
    >
      {booking && (
        <div className="flex flex-col gap-4">
          <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
            This only cancels the appointment slot. The advance payment already collected isn&apos;t
            refunded automatically — use Request Refund from Transactions if the patient needs it
            back.
          </p>
          <Textarea
            rows={3}
            placeholder="Reason (optional)"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setError(undefined);
            }}
            error={error}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Keep Appointment
            </Button>
            <Button variant="danger" onClick={handleConfirm} isLoading={cancelBooking.isPending}>
              Cancel Appointment
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
