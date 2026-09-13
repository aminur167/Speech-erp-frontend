"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useVoidPayment } from "@/hooks/payments/useVoidPayment";
import { formatCurrency } from "@/utils/currency";
import type { Payment } from "@/types/domain";

export function VoidPaymentModal({
  payment,
  onClose,
}: {
  payment: Payment | null;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | undefined>();
  const voidPayment = useVoidPayment();

  const handleClose = () => {
    setReason("");
    setError(undefined);
    voidPayment.reset();
    onClose();
  };

  const handleConfirm = () => {
    if (!payment) return;
    if (!reason.trim()) {
      setError("A reason is required to void a payment.");
      return;
    }
    voidPayment.mutate(
      { paymentId: payment.id, reason },
      {
        onSuccess: handleClose,
      },
    );
  };

  return (
    <Modal
      open={Boolean(payment)}
      onClose={handleClose}
      title="Void Payment"
      description={
        payment
          ? `${payment.receiptNumber} — ${formatCurrency(payment.amount)}. This cancels the payment as though it never happened.`
          : undefined
      }
    >
      {payment && (
        <div className="flex flex-col gap-4">
          <Textarea
            label="Reason"
            placeholder="Why is this payment being voided?"
            rows={3}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setError(undefined);
            }}
            error={error}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirm} isLoading={voidPayment.isPending}>
              Void Payment
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
