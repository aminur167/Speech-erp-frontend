"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useUpdateExpenseStatus } from "@/hooks/expenses/useUpdateExpenseStatus";
import type { ApiError } from "@/types/api";
import type { Expense } from "@/types/domain";

export function RejectExpenseModal({
  expense,
  onClose,
}: {
  expense: Expense | null;
  onClose: () => void;
}) {
  const [reviewNote, setReviewNote] = useState("");
  const [error, setError] = useState<string | undefined>();
  const updateStatus = useUpdateExpenseStatus();

  const handleClose = () => {
    setReviewNote("");
    setError(undefined);
    updateStatus.reset();
    onClose();
  };

  const handleConfirm = () => {
    if (!expense) return;
    if (!reviewNote.trim()) {
      setError("A reason is required to reject an expense.");
      return;
    }
    updateStatus.mutate(
      { id: expense.id, approve: false, reviewNote },
      {
        onSuccess: handleClose,
        onError: (apiError: ApiError) => setError(apiError.message),
      },
    );
  };

  return (
    <Modal
      open={Boolean(expense)}
      onClose={handleClose}
      title="Reject Expense"
      description={
        expense
          ? `${expense.expenseCode} — ${expense.description}. This reason is shown to the branch.`
          : undefined
      }
    >
      {expense && (
        <div className="flex flex-col gap-4">
          <Textarea
            rows={3}
            placeholder="Why is this being rejected?"
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
            <Button
              variant="danger"
              onClick={handleConfirm}
              isLoading={updateStatus.isPending}
            >
              Reject Expense
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
