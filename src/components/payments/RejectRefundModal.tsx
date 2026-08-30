"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useRejectRefund } from "@/hooks/payments/useRejectRefund";
import { formatCurrency } from "@/utils/currency";
import type { ApiError } from "@/types/api";
import type { RefundRequest } from "@/types/domain";

export function RejectRefundModal({
  refund,
  onClose,
}: {
  refund: RefundRequest | null;
  onClose: () => void;
}) {
  const [reviewNote, setReviewNote] = useState("");
  const [error, setError] = useState<string | undefined>();
  const rejectRefund = useRejectRefund();

  const handleClose = () => {
    setReviewNote("");
    setError(undefined);
    rejectRefund.reset();
    onClose();
  };

  const handleConfirm = () => {
    if (!refund) return;
    if (!reviewNote.trim()) {
      setError("A reason is required to reject a refund request.");
      return;
    }
    rejectRefund.mutate(
      { id: refund.id, reviewNote },
      {
        onSuccess: handleClose,
        onError: (apiError: ApiError) => setError(apiError.message),
      },
    );
  };

  return (
    <Modal
      open={Boolean(refund)}
      onClose={handleClose}
      title="Reject Refund Request"
      description={
        refund
          ? `${refund.payment.receiptNumber} — ${formatCurrency(refund.amount)} requested by ${refund.requestedBy}.`
          : undefined
      }
    >
      {refund && (
        <div className="flex flex-col gap-4">
          <Textarea
            rows={3}
            placeholder="Why is this request being rejected?"
            value={reviewNote}
            onChange={(event) => {
              setReviewNote(event.target.value);
              setError(undefined);
            }}
            error={error}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirm} isLoading={rejectRefund.isPending}>
              Reject Request
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
