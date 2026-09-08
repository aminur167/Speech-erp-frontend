"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useReviewSalaryPayment } from "@/hooks/salaryPayments/useReviewSalaryPayment";
import { formatCurrency } from "@/utils/currency";
import type { ApiError } from "@/types/api";
import type { SalaryPayment } from "@/types/domain";

export function RejectSalaryPaymentModal({
  payment,
  onClose,
}: {
  payment: SalaryPayment | null;
  onClose: () => void;
}) {
  const [reviewNote, setReviewNote] = useState("");
  const [error, setError] = useState<string | undefined>();
  const reviewPayment = useReviewSalaryPayment();

  const handleClose = () => {
    setReviewNote("");
    setError(undefined);
    reviewPayment.reset();
    onClose();
  };

  const handleConfirm = () => {
    if (!payment) return;
    if (!reviewNote.trim()) {
      setError("A reason is required to reject a salary payment.");
      return;
    }
    reviewPayment.mutate(
      { id: payment.id, approve: false, reviewNote },
      { onSuccess: handleClose, onError: (apiError: ApiError) => setError(apiError.message) },
    );
  };

  return (
    <Modal
      open={Boolean(payment)}
      onClose={handleClose}
      title="Reject Salary Payment"
      description={
        payment
          ? `${payment.staffName} — ${formatCurrency(payment.amount)} for ${payment.month}, requested by ${payment.requestedBy}.`
          : undefined
      }
    >
      {payment && (
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
            <Button variant="danger" onClick={handleConfirm} isLoading={reviewPayment.isPending}>
              Reject Request
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
