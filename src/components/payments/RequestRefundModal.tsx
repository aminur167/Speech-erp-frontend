"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useRequestRefund } from "@/hooks/payments/useRequestRefund";
import { formatCurrency } from "@/utils/currency";
import type { ApiError } from "@/types/api";
import type { Payment } from "@/types/domain";

export function RequestRefundModal({
  payment,
  onClose,
}: {
  payment: Payment | null;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | undefined>();
  const requestRefund = useRequestRefund();

  const handleClose = () => {
    setAmount("");
    setReason("");
    setError(undefined);
    requestRefund.reset();
    onClose();
  };

  const handleConfirm = () => {
    if (!payment) return;
    if (!reason.trim()) {
      setError("A reason is required to request a refund.");
      return;
    }
    const numericAmount = Number(amount);
    if (!amount || !(numericAmount > 0)) {
      setError("Enter a refund amount greater than 0.");
      return;
    }
    requestRefund.mutate(
      { paymentId: payment.id, amount: numericAmount, reason },
      {
        onSuccess: handleClose,
        onError: (apiError: ApiError) => setError(apiError.message),
      },
    );
  };

  return (
    <Modal
      open={Boolean(payment)}
      onClose={handleClose}
      title="Request Refund"
      description={
        payment
          ? `${payment.receiptNumber} — paid ${formatCurrency(payment.amount)}. An Admin must approve this before any money moves.`
          : undefined
      }
    >
      {payment && (
        <div className="flex flex-col gap-4">
          <Input
            type="number"
            step="0.01"
            placeholder="Refund amount"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              setError(undefined);
            }}
          />
          <Textarea
            rows={3}
            placeholder="Why is this refund needed?"
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
            <Button onClick={handleConfirm} isLoading={requestRefund.isPending}>
              Submit Request
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
