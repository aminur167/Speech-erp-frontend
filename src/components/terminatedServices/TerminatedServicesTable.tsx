"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { RowDetailDrawer, useRowDetail } from "@/components/ui/RowDetailDrawer";
import { formatCurrency } from "@/utils/currency";
import type { TerminatedMonthlyService } from "@/lib/api/monthlyEnrollments";

/**
 * Every monthly service that is no longer running, however it stopped.
 *
 * The columns are ordered the way a manager reads the screen: they arrive
 * holding a patient's name or phone, confirm it is the right person and the
 * right service, then look at what is owed before deciding.
 */
export function TerminatedServicesTable({
  services,
  onResume,
}: {
  services: TerminatedMonthlyService[];
  onResume?: (service: TerminatedMonthlyService) => void;
}) {
  const detail = useRowDetail<TerminatedMonthlyService>();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="py-2 pr-4 font-medium">Patient</th>
            <th className="py-2 pr-4 font-medium">Phone</th>
            <th className="py-2 pr-4 font-medium">Service</th>
            <th className="py-2 pr-4 font-medium">Reason</th>
            <th className="py-2 pr-4 font-medium">Terminated On</th>
            <th className="py-2 pr-4 text-right font-medium">Previous Due</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            {onResume && <th className="py-2 pr-4 font-medium">Action</th>}
          </tr>
        </thead>
        <tbody>
          {services.map((service) => (
            <tr key={service.id} {...detail.rowProps(service)}>
              <td className="py-2 pr-4">
                <p className="font-medium text-text-primary">{service.patientName}</p>
                <p className="font-mono text-xs text-text-secondary">
                  {service.patientCode}
                </p>
              </td>
              <td className="whitespace-nowrap py-2 pr-4 text-text-secondary">
                {service.patientPhone || "—"}
              </td>
              <td className="py-2 pr-4">
                <p className="text-text-primary">{service.serviceName}</p>
                <p className="font-mono text-xs text-text-secondary">
                  {service.serviceCode}
                </p>
              </td>
              <td className="py-2 pr-4">
                {/* Tested for the automatic kind rather than the manual one:
                    services stopped before this field existed carry a blank,
                    and reading a blank as "unpaid due" would accuse the
                    clinic of a debt that was never there. */}
                {service.terminatedKind === "unpaid_due" ? (
                  <>
                    <Badge tone="warning" label="Unpaid due" />
                    {service.terminatedMonthLabel && (
                      <p className="mt-0.5 text-xs text-text-secondary">
                        after {service.terminatedMonthLabel}
                      </p>
                    )}
                  </>
                ) : (
                  <Badge tone="neutral" label="Stopped by manager" />
                )}
              </td>
              <td className="whitespace-nowrap py-2 pr-4 text-text-secondary">
                {service.terminatedAt
                  ? new Date(service.terminatedAt).toLocaleDateString()
                  : "—"}
              </td>
              <td
                className={
                  service.previousDue > 0
                    ? "py-2 pr-4 text-right font-medium tabular-nums text-danger"
                    : "py-2 pr-4 text-right tabular-nums text-text-secondary"
                }
              >
                {formatCurrency(service.previousDue)}
              </td>
              <td className="py-2 pr-4">
                <Badge tone="danger" label="Terminated" />
              </td>
              {onResume && (
                <td className="py-2 pr-4">
                  <Button
                    className="whitespace-nowrap px-3 py-1.5 text-xs"
                    onClick={() => onResume(service)}
                  >
                    Resume Service
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <RowDetailDrawer
        open={detail.isOpen}
        onClose={detail.close}
        title={detail.selected?.patientName ?? ""}
        subtitle={detail.selected?.serviceName ?? undefined}
        data={detail.selected}
      />
    </div>
  );
}
