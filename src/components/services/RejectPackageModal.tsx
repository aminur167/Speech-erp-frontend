"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useReviewService } from "@/hooks/services/useReviewService";
import type { ApiError } from "@/types/api";
import type { Service } from "@/types/domain";

export function RejectPackageModal({
  service,
  onClose,
}: {
  service: Service | null;
  onClose: () => void;
}) {
  const [reviewNote, setReviewNote] = useState("");
  const [error, setError] = useState<string | undefined>();
  const reviewServiceMutation = useReviewService();

  const handleClose = () => {
    setReviewNote("");
    setError(undefined);
    reviewServiceMutation.reset();
    onClose();
  };

  const handleConfirm = () => {
    if (!service) return;
    if (!reviewNote.trim()) {
      setError("A reason is required to reject a proposed package.");
      return;
    }
    reviewServiceMutation.mutate(
      { id: service.id, approve: false, reviewNote },
      {
        onSuccess: handleClose,
        onError: (apiError: ApiError) => setError(apiError.message),
      },
    );
  };

  return (
    <Modal
      open={Boolean(service)}
      onClose={handleClose}
      title="Reject Package"
      description={
        service
          ? `${service.name} (${service.code}) — proposed by ${service.proposedBy || "a branch manager"}. This reason is shown to them.`
          : undefined
      }
    >
      {service && (
        <div className="flex flex-col gap-4">
          <Textarea
            rows={3}
            placeholder="Why is this package being rejected?"
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
              isLoading={reviewServiceMutation.isPending}
            >
              Reject Package
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
