"use client";

import { Check, Pencil, Power, PowerOff, Trash2, X as XIcon } from "lucide-react";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/ActionMenu";
import type { Service } from "@/types/domain";

/**
 * The actions available for one package, shared between the card grid and
 * the table row — same handlers, same rules (pending gets Approve/Reject,
 * rejected gets a cleanup Remove, approved gets Edit / (de)activate / Delete,
 * Manager gets nothing since only Admin writes). Written once here so the two
 * layouts can't quietly drift apart; both now show them in one 3-dot menu.
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
  /** Kept for callers; the menu is the same in a table cell and on a card. */
  compact?: boolean;
}) {
  if (!canManage) return null;

  let items: ActionMenuItem[];

  if (service.reviewStatus === "pending") {
    items = [
      {
        key: "approve",
        label: isApproving ? "Approving…" : "Approve",
        icon: Check,
        disabled: isApproving,
        onSelect: () => onApprove(service),
      },
      { key: "reject", label: "Reject", icon: XIcon, tone: "danger", onSelect: () => onReject(service) },
    ];
  } else if (service.reviewStatus === "rejected") {
    items = [
      {
        key: "remove",
        label: "Remove from catalog",
        icon: Trash2,
        tone: "danger",
        onSelect: () => onDelete(service),
      },
    ];
  } else {
    items = [
      { key: "edit", label: "Edit", icon: Pencil, onSelect: () => onEdit(service) },
      {
        key: "toggle",
        label: service.isActive ? "Deactivate" : "Activate",
        icon: service.isActive ? PowerOff : Power,
        hint: service.isActive ? "Stops new enrollments; current plans keep billing" : undefined,
        disabled: isToggling,
        onSelect: () => onToggleActive(service),
      },
      { key: "delete", label: "Delete", icon: Trash2, tone: "danger", onSelect: () => onDelete(service) },
    ];
  }

  return <ActionMenu label={`Actions for ${service.name}`} items={items} />;
}
