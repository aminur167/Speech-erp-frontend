"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useRequestPackageAction } from "@/hooks/services/usePackageActionRequests";
import type { PackageAction, Service } from "@/types/domain";

const COPY: Record<PackageAction, { title: string; verb: string; placeholder: string }> = {
  edit: {
    title: "Request to edit package",
    verb: "edit",
    placeholder: "e.g. Head office changed the monthly fee to ৳6,000",
  },
  delete: {
    title: "Request to delete package",
    verb: "delete",
    placeholder: "e.g. Created by mistake — a duplicate of an existing package",
  },
  deactivate: {
    title: "Request to deactivate package",
    verb: "deactivate",
    placeholder: "e.g. No therapist available for this service any more",
  },
  activate: {
    title: "Request to activate package",
    verb: "activate",
    placeholder: "e.g. The therapist is back; we are taking new patients again",
  },
};

/**
 * A Manager asks Admin for permission to change a package, with a reason.
 *
 * Nothing changes on the package here. If Admin approves, the Manager can do
 * this one thing once, from the same menu.
 */
export function RequestPackageActionModal({
  service,
  action,
  onClose,
}: {
  /** Null closes the dialog. */
  service: Service | null;
  action: PackageAction | null;
  onClose: () => void;
}) {
  const requestAction = useRequestPackageAction();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | undefined>();

  // A different package or action starts from a blank reason. Adjusted during
  // render, React's guidance for state that depends on a prop.
  const key = service && action ? `${service.id}:${action}` : null;
  const [answeringFor, setAnsweringFor] = useState(key);
  if (key !== answeringFor) {
    setAnsweringFor(key);
    setReason("");
    setError(undefined);
  }

  const copy = action ? COPY[action] : null;

  const submit = () => {
    if (!service || !action) return;
    if (!reason.trim()) {
      setError("Say why this change is needed — Admin decides on the reason.");
      return;
    }
    requestAction.mutate(
      { serviceId: service.id, action, reason: reason.trim() },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      open={Boolean(service && action)}
      onClose={onClose}
      title={copy?.title ?? ""}
      description={service ? `${service.name} (${service.code})` : undefined}
    >
      {copy && (
        <div className="flex flex-col gap-4">
          <p className="rounded-lg bg-primary-light/60 px-3 py-2 text-xs text-primary-dark">
            Admin reviews this request. If it is approved, you can {copy.verb} this package
            once, from the same menu, before the approval expires.
          </p>
          <Textarea
            label="Reason"
            requiredMark
            rows={3}
            placeholder={copy.placeholder}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setError(undefined);
            }}
            error={error}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={requestAction.isPending}>
              Cancel
            </Button>
            <Button onClick={submit} isLoading={requestAction.isPending}>
              Send request
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
