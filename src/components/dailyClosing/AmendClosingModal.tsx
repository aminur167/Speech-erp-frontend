"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useAmendClosing } from "@/hooks/dailyClosing/useAmendClosing";
import { formatCurrency } from "@/utils/currency";
import type { ApiError } from "@/types/api";
import type { DailyClosing } from "@/types/domain";

export function AmendClosingModal({
  closing,
  onClose,
}: {
  closing: DailyClosing | null;
  onClose: () => void;
}) {
  const [correctedActualTotal, setCorrectedActualTotal] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | undefined>();
  const amendClosing = useAmendClosing();

  const handleClose = () => {
    setCorrectedActualTotal("");
    setReason("");
    setError(undefined);
    amendClosing.reset();
    onClose();
  };

  const handleConfirm = () => {
    if (!closing) return;
    if (!reason.trim()) {
      setError("A reason is required to correct a closing.");
      return;
    }
    const numericTotal = Number(correctedActualTotal);
    if (correctedActualTotal === "" || Number.isNaN(numericTotal) || numericTotal < 0) {
      setError("Enter a valid corrected total.");
      return;
    }
    amendClosing.mutate(
      { id: closing.id, correctedActualTotal: numericTotal, reason },
      {
        onSuccess: handleClose,
        onError: (apiError: ApiError) => setError(apiError.message),
      },
    );
  };

  return (
    <Modal
      open={Boolean(closing)}
      onClose={handleClose}
      title="Correct Closing"
      description={
        closing
          ? `${closing.date} — currently ${formatCurrency(closing.actualTotal)}. The original figure is kept, never overwritten.`
          : undefined
      }
    >
      {closing && (
        <div className="flex flex-col gap-4">
          <Input
            type="number"
            step="0.01"
            placeholder="Corrected actual total"
            value={correctedActualTotal}
            onChange={(event) => {
              setCorrectedActualTotal(event.target.value);
              setError(undefined);
            }}
          />
          <Textarea
            rows={3}
            placeholder="Why is this being corrected?"
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
            <Button onClick={handleConfirm} isLoading={amendClosing.isPending}>
              Save Correction
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
