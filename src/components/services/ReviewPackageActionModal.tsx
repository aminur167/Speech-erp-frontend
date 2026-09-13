"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useReviewPackageAction } from "@/hooks/services/usePackageActionRequests";
import type { PackageActionRequest } from "@/types/domain";

const VERB = { edit: "edit", delete: "delete", deactivate: "deactivate", activate: "activate" } as const;

/**
 * Admin approves or rejects a Manager's request to change a package.
 * Rejecting needs a reason; the Manager is told either way.
 */
export function ReviewPackageActionModal({
  request,
  mode,
  onClose,
}: {
  request: PackageActionRequest | null;
  mode: "approve" | "reject" | null;
  onClose: () => void;
}) {
  const review = useReviewPackageAction();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | undefined>();

  const key = request && mode ? `${request.id}:${mode}` : null;
  const [answeringFor, setAnsweringFor] = useState(key);
  if (key !== answeringFor) {
    setAnsweringFor(key);
    setNote("");
    setError(undefined);
  }

  const approving = mode === "approve";

  const submit = () => {
    if (!request || !mode) return;
    if (!approving && !note.trim()) {
      setError("Say why — the Manager needs something to act on.");
      return;
    }
    review.mutate(
      { id: request.id, approve: approving, reviewNote: note.trim() || undefined },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      open={Boolean(request && mode)}
      onClose={onClose}
      title={approving ? "Approve request" : "Reject request"}
      description={
        request
          ? `${request.branchName} wants to ${VERB[request.action]} "${request.serviceName}" (${request.serviceCode})`
          : undefined
      }
    >
      {request && (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <p className="text-xs font-medium text-text-secondary">Manager&apos;s reason</p>
            <p className="mt-0.5 text-text-primary">{request.reason}</p>
          </div>
          {approving && (
            <p className="text-xs text-text-secondary">
              {request.requestedBy || "The Manager"} will be able to {VERB[request.action]} this
              package once, before the approval expires.
            </p>
          )}
          <Textarea
            label={approving ? "Note (optional)" : "Reason"}
            requiredMark={!approving}
            rows={2}
            placeholder={
              approving ? "Anything the Manager should know" : "Why is this request being rejected?"
            }
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              setError(undefined);
            }}
            error={error}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={review.isPending}>
              Cancel
            </Button>
            <Button
              variant={approving ? "primary" : "danger"}
              onClick={submit}
              isLoading={review.isPending}
            >
              {approving ? "Approve" : "Reject"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
