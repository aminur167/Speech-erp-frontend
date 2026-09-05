"use client";

import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/currency";
import type { DuePaymentItem } from "@/lib/api/duePayments";

/**
 * Confirms stopping a patient's service.
 *
 * The number that matters here is the whole unpaid balance, not the
 * installment payable today: terminating writes off everything still owed,
 * so showing the smaller figure would understate what the manager is about
 * to forgive. Deliberately its own component rather than ConfirmDialog —
 * the amount needs to be stated plainly enough that nobody clicks past it.
 */
export function TerminateServiceModal({
  item,
  onConfirm,
  onClose,
  isTerminating,
  error,
}: {
  item: DuePaymentItem | null;
  onConfirm: () => void;
  onClose: () => void;
  isTerminating?: boolean;
  error?: string | null;
}) {
  const outstanding = item?.outstandingTotal ?? 0;
  const hasDue = outstanding > 0;

  return (
    <Modal
      open={Boolean(item)}
      onClose={onClose}
      title="Stop this service?"
      description={
        item ? `${item.patientName} — ${item.serviceName}` : undefined
      }
    >
      {item && (
        <div className="flex flex-col gap-4">
          {hasDue && (
            <div className="flex gap-3 rounded-lg border border-danger/30 bg-danger/5 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-danger">
                  This patient still owes money
                </p>
                <p className="text-xs text-text-secondary">
                  Stopping the service writes off the full outstanding balance.
                  It disappears from Outstanding Due and can&apos;t be collected
                  afterwards. The write-off is recorded in the audit log.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Service</span>
              <span className="font-medium text-text-primary">{item.serviceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Type</span>
              <span className="font-medium capitalize text-text-primary">{item.type}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-text-secondary">
                {hasDue ? "Total due to be written off" : "Total due"}
              </span>
              <span
                className={
                  hasDue
                    ? "text-lg font-semibold text-danger"
                    : "text-lg font-semibold text-text-primary"
                }
              >
                {formatCurrency(outstanding)}
              </span>
            </div>
          </div>

          <p className="text-sm text-text-primary">
            {hasDue
              ? `Are you sure you want to stop this service and write off ${formatCurrency(outstanding)}?`
              : "Are you sure you want to stop this service? It will no longer generate bills."}
          </p>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={isTerminating}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onConfirm} isLoading={isTerminating}>
              Confirm Terminate
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
