"use client";

import { clsx } from "clsx";
import { Badge } from "@/components/ui/Badge";
import { PackageActions } from "@/components/services/PackageActions";
import { formatCurrency } from "@/utils/currency";
import type { Service, ServiceCategory } from "@/types/domain";

const CATEGORY_LABEL: Record<ServiceCategory, string> = {
  daily: "Daily",
  monthly: "Monthly",
  installment: "Installment",
  online: "Online",
};

export function PackageTable({
  services,
  canManage,
  enrollmentCounts,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  onToggleActive,
  approvingId,
  togglingId,
}: {
  services: Service[];
  canManage: boolean;
  enrollmentCounts?: Record<string, number>;
  onApprove: (service: Service) => void;
  onReject: (service: Service) => void;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  onToggleActive: (service: Service) => void;
  approvingId?: string;
  togglingId?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium text-text-secondary">
            <th className="py-2 pr-3">Package</th>
            <th className="py-2 pr-3">Category</th>
            <th className="py-2 pr-3">Fee</th>
            <th className="py-2 pr-3">Status</th>
            <th className="py-2 pr-3">Enrolled</th>
            {canManage && <th className="py-2 pr-3">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {services.map((service) => (
            <tr key={service.id} className="border-b border-border/60 align-top">
              <td className="py-2.5 pr-3">
                <p className="font-medium text-text-primary">{service.name}</p>
                <p className="font-mono text-[11px] text-text-secondary">{service.code}</p>
                {service.reviewStatus === "pending" && service.proposedBy && (
                  <p className="mt-0.5 text-[11px] text-warning">By {service.proposedBy}</p>
                )}
                {service.reviewStatus === "rejected" && service.reviewNote && (
                  <p className="mt-0.5 text-[11px] text-danger">Rejected: {service.reviewNote}</p>
                )}
              </td>
              <td className="py-2.5 pr-3 text-text-secondary">
                {CATEGORY_LABEL[service.category]}
              </td>
              <td className="py-2.5 pr-3">
                <span className="font-medium text-text-primary">
                  {formatCurrency(service.fee)}
                </span>
                {Boolean(service.originalFee && service.originalFee > service.fee) && (
                  <span className="ml-1.5 text-xs text-text-secondary line-through">
                    {formatCurrency(service.originalFee as number)}
                  </span>
                )}
              </td>
              <td className="py-2.5 pr-3">
                {service.reviewStatus === "pending" && (
                  <Badge tone="warning" label="Pending Review" />
                )}
                {service.reviewStatus === "rejected" && <Badge tone="danger" label="Rejected" />}
                {service.reviewStatus === "approved" &&
                  (service.isActive ? (
                    <Badge tone="success" label="Available" />
                  ) : (
                    <Badge tone="neutral" label="Inactive" />
                  ))}
              </td>
              <td
                className={clsx(
                  "py-2.5 pr-3",
                  enrollmentCounts?.[service.id] ? "text-text-primary" : "text-text-secondary/60",
                )}
              >
                {enrollmentCounts?.[service.id] ?? "—"}
              </td>
              {canManage && (
                <td className="py-2.5 pr-3">
                  <PackageActions
                    service={service}
                    canManage={canManage}
                    onApprove={onApprove}
                    onReject={onReject}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleActive={onToggleActive}
                    isApproving={approvingId === service.id}
                    isToggling={togglingId === service.id}
                    compact
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
