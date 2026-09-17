"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PaymentMethodSelector } from "@/components/payments/PaymentMethodSelector";
import { useCollectBookingAdvance } from "@/hooks/enrollments/useCollectBookingAdvance";
import { formatCurrency } from "@/utils/currency";
import { formatTimeLabel } from "@/utils/time";
import type { Booking, PaymentMethod } from "@/types/domain";

/** A website booking arrives with the advance still unpaid — this records the manager taking it in person. */
export function CollectAdvanceModal({
  booking,
  onClose,
}: {
  booking: Booking | null;
  onClose: () => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const collectAdvance = useCollectBookingAdvance();

  const handleClose = () => {
    setMethod("cash");
    collectAdvance.reset();
    onClose();
  };

  const handleConfirm = () => {
    if (!booking) return;
    collectAdvance.mutate(
      { bookingId: booking.id, method },
      { onSuccess: handleClose },
    );
  };

  return (
    <Modal
      open={Boolean(booking)}
      onClose={handleClose}
      title="Collect Advance Payment"
      description={
        booking
          ? `${booking.patientName} — ${booking.serviceName} on ${booking.date} at ${formatTimeLabel(booking.time)}.`
          : undefined
      }
    >
      {booking && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between rounded-lg border border-border bg-background p-4 text-sm">
            <span className="text-text-secondary">Amount due</span>
            <span className="text-lg font-semibold text-primary-dark">
              {formatCurrency(booking.advanceAmount)}
            </span>
          </div>
          <PaymentMethodSelector value={method} onChange={setMethod} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} isLoading={collectAdvance.isPending}>
              Confirm Payment Received
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
