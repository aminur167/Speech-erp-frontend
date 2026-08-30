"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useApproveRefund } from "@/hooks/payments/useApproveRefund";
import { formatCurrency } from "@/utils/currency";
import type { ApiError } from "@/types/api";
import type { RefundBillAction, RefundRequest } from "@/types/domain";

/** Only meaningful for monthly/installment payments — a material sale's stock return doesn't touch a bill. */
const APPLIES_TO_BILL = new Set(["monthly", "installment"]);

export function ApproveRefundModal({
  refund,
  onClose,
}: {
  refund: RefundRequest | null;
  onClose: () => void;
}) {
  const [billAction, setBillAction] = useState<RefundBillAction>("reopen");
  const [reviewNote, setReviewNote] = useState("");
  const [error, setError] = useState<string | undefined>();
  const approveRefund = useApproveRefund();

  const handleClose = () => {
    setBillAction("reopen");
    setReviewNote("");
    setError(undefined);
    approveRefund.reset();
    onClose();
  };

  const handleConfirm = () => {
    if (!refund) return;
    approveRefund.mutate(
      { id: refund.id, billAction, reviewNote: reviewNote.trim() || undefined },
      {
        onSuccess: handleClose,
        onError: (apiError: ApiError) => setError(apiError.message),
      },
    );
  };

  const showBillAction = refund && APPLIES_TO_BILL.has(refund.payment.category ?? "");

  return (
    <Modal
      open={Boolean(refund)}
      onClose={handleClose}
      title="Approve Refund"
      description={
        refund
          ? `${refund.payment.receiptNumber} — refund ${formatCurrency(refund.amount)} to the patient.`
          : undefined
      }
    >
      {refund && (
        <div className="flex flex-col gap-4">
          {showBillAction && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-secondary">
                What happens to the bill?
              </label>
              <Select
                value={billAction}
                onChange={(event) => setBillAction(event.target.value as RefundBillAction)}
              >
                <option value="reopen">Reopen — the patient owes it again</option>
                <option value="write_off">Write off — forgive it entirely</option>
              </Select>
            </div>
          )}
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
            <Button onClick={handleConfirm} isLoading={approveRefund.isPending}>
              Approve Refund
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
