"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useReviewSalaryPayment } from "@/hooks/salaryPayments/useReviewSalaryPayment";
import { formatCurrency } from "@/utils/currency";
import type { ApiError } from "@/types/api";
import type { SalaryPayment } from "@/types/domain";

export function ApproveSalaryPaymentModal({
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
    reviewPayment.mutate(
      { id: payment.id, approve: true, reviewNote: reviewNote.trim() || undefined },
      { onSuccess: handleClose, onError: (apiError: ApiError) => setError(apiError.message) },
    );
  };

  return (
    <Modal
      open={Boolean(payment)}
      onClose={handleClose}
      title="Approve Salary Payment"
      description={
        payment
          ? `${payment.staffName} — ${formatCurrency(payment.amount)} for ${payment.month}. The branch manager can pay it out once approved.`
          : undefined
      }
    >
      {payment && (
        <div className="flex flex-col gap-4">
          <Textarea
            rows={2}
            placeholder="Note (optional)"
            value={reviewNote}
            onChange={(event) => setReviewNote(event.target.value)}
            error={error}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} isLoading={reviewPayment.isPending}>
              Approve Payment
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
