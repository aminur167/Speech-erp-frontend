"use client";

import { Pencil, Trash2, PowerOff, Power, Check, X as XIcon } from "lucide-react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import type { Service } from "@/types/domain";

/**
 * The actions available for one package, shared between the card grid and
 * the table row — same handlers, same rules (pending gets Approve/Reject,
 * rejected gets a cleanup Delete, approved gets the normal Edit/Delete/
 * (de)activate set, Manager gets nothing since only Admin writes). Written
 * once here so the two layouts can't quietly drift apart.
 */
export function PackageActions({
  service,
  canManage,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  onToggleActive,
  isApproving,
  isToggling,
  compact,
}: {
  service: Service;
  canManage: boolean;
  onApprove: (service: Service) => void;
  onReject: (service: Service) => void;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  onToggleActive: (service: Service) => void;
  isApproving?: boolean;
  isToggling?: boolean;
  /** Small icon-only buttons in a single row, for a table cell — vs the full-width stacked buttons a card has room for. */
  compact?: boolean;
}) {
  if (!canManage) return null;

  const btnClass = compact ? "px-2 py-1.5" : undefined;

  if (service.reviewStatus === "pending") {
    return (
      <div className={clsx("flex gap-2", compact ? "" : "w-full")}>
        {/* Compact renders these icon-only, so the label has to come from
            aria-label or the button has no accessible name at all. */}
        <Button
          className={clsx(btnClass, !compact && "flex-1")}
          onClick={() => onApprove(service)}
          isLoading={isApproving}
          aria-label={`Approve ${service.name}`}
          title="Approve"
        >
          <Check className="h-4 w-4" />
          {!compact && "Approve"}
        </Button>
        <Button
          variant="danger"
          className={clsx(btnClass, !compact && "flex-1")}
          onClick={() => onReject(service)}
          aria-label={`Reject ${service.name}`}
          title="Reject"
        >
          <XIcon className="h-4 w-4" />
          {!compact && "Reject"}
        </Button>
      </div>
    );
  }

  if (service.reviewStatus === "rejected") {
    return (
      <Button
        variant="danger"
        className={clsx(btnClass, !compact && "w-full")}
        onClick={() => onDelete(service)}
      >
        <Trash2 className="h-4 w-4" />
        {!compact && "Remove from catalog"}
      </Button>
    );
  }

  if (compact) {
    return (
      <div className="flex gap-1.5">
        <Button
          variant="secondary"
          className={btnClass}
          onClick={() => onEdit(service)}
          aria-label={`Edit ${service.name}`}
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="danger"
          className={btnClass}
          onClick={() => onDelete(service)}
          aria-label={`Delete ${service.name}`}
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          className={btnClass}
          onClick={() => onToggleActive(service)}
          disabled={isToggling}
          aria-label={`${service.isActive ? "Deactivate" : "Activate"} ${service.name}`}
          title={service.isActive ? "Deactivate" : "Activate"}
        >
          {service.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => onEdit(service)}>
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
        <Button variant="danger" className="flex-1" onClick={() => onDelete(service)}>
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
      <Button
        variant="secondary"
        className="w-full"
        onClick={() => onToggleActive(service)}
        disabled={isToggling}
      >
        {service.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
        {service.isActive ? "Deactivate" : "Activate"}
      </Button>
    </div>
  );
}
