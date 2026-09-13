"use client";

import {
  Check,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  X as XIcon,
  type LucideIcon,
} from "lucide-react";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/ActionMenu";
import type { PackageAction, PackageActionRequest, Service } from "@/types/domain";

/** What the Manager's menu needs to know about requests to Admin. */
export interface ManagerPackageRequests {
  /** Open requests keyed `${serviceId}:${action}` — pending, or approved and unspent. */
  lookup: Record<string, PackageActionRequest | undefined>;
  currentUserId?: string;
  onRequest: (service: Service, action: PackageAction) => void;
}

/**
 * The actions available for one package, shared between the card grid and
 * the table row — written once so the two layouts can't drift apart.
 *
 * - **Admin** acts directly: pending gets Approve/Reject, rejected gets a
 *   cleanup Remove, a live package gets Edit / (de)activate / Delete.
 * - **Manager** gets the same Edit / (de)activate / Delete on their branch's
 *   live packages, but each one goes through Admin first. Every item shows
 *   where that stands: *Request to edit…* when nothing has been asked,
 *   disabled *Waiting for Admin approval* while it is pending, and the real
 *   action — usable once — when Admin approved it for this Manager.
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
  managerRequests,
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
  /** Set on the Manager's catalog: changes are requested from Admin first. */
  managerRequests?: ManagerPackageRequests;
}) {
  if (!canManage) {
    // A Manager can only change a live package; their own proposals are
    // decided by Admin, not edited through requests.
    if (!managerRequests || service.reviewStatus !== "approved") return null;

    const toggleAction: PackageAction = service.isActive ? "deactivate" : "activate";
    return (
      <ActionMenu
        label={`Actions for ${service.name}`}
        items={[
          managerItem(service, managerRequests, "edit", "Edit", Pencil, () => onEdit(service)),
          managerItem(
            service,
            managerRequests,
            toggleAction,
            service.isActive ? "Deactivate" : "Activate",
            service.isActive ? PowerOff : Power,
            () => onToggleActive(service),
          ),
          managerItem(service, managerRequests, "delete", "Delete", Trash2, () => onDelete(service), true),
        ]}
      />
    );
  }

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

/** One Manager menu item, in whichever of its three states it is. */
function managerItem(
  service: Service,
  requests: ManagerPackageRequests,
  action: PackageAction,
  label: string,
  icon: LucideIcon,
  perform: () => void,
  danger = false,
): ActionMenuItem {
  const request = requests.lookup[`${service.id}:${action}`];

  // Only the Manager who asked may use an approval.
  if (request?.status === "approved" && request.requestedById === requests.currentUserId) {
    return {
      key: action,
      label,
      icon,
      tone: danger ? "danger" : "default",
      hint: "Approved by Admin — one use",
      onSelect: perform,
    };
  }

  if (request?.status === "pending") {
    return {
      key: action,
      label,
      icon,
      disabled: true,
      hint: "Waiting for Admin approval",
      onSelect: () => {},
    };
  }

  return {
    key: action,
    label: `Request to ${label.toLowerCase()}…`,
    icon,
    hint: "Needs Admin approval",
    onSelect: () => requests.onRequest(service, action),
  };
}
