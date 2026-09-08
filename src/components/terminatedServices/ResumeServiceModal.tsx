"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { AlertTriangle, Check } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PaymentMethodSelector } from "@/components/payments/PaymentMethodSelector";
import { formatCurrency } from "@/utils/currency";
import type { TerminatedMonthlyService } from "@/lib/api/monthlyEnrollments";
import type { PaymentMethod } from "@/types/domain";

/**
 * Restarting a stopped service, and deciding what happens to the arrears.
 *
 * The two options are a choice inside one dialog rather than two buttons on
 * the row, because they are not the same action with different labels: one
 * collects real money, the other forgives it. Nothing is submitted until the
 * manager has picked one and pressed Confirm — waiving several thousand taka
 * should not be one stray click away.
 *
 * With nothing outstanding — which is every service a manager stopped by
 * hand, since stopping it already wrote the debt off — the choice disappears
 * instead of being shown greyed out or leading to the same place twice.
 */
export function ResumeServiceModal({
  service,
  onConfirm,
  onClose,
  isResuming,
  error,
}: {
  service: TerminatedMonthlyService | null;
  onConfirm: (choice: { carryDue: boolean; method: PaymentMethod }) => void;
  onClose: () => void;
  isResuming?: boolean;
  error?: string | null;
}) {
  const [carryDue, setCarryDue] = useState(true);
  const [method, setMethod] = useState<PaymentMethod>("cash");

  const previousDue = service?.previousDue ?? 0;
  const hasDue = previousDue > 0;

  const handleClose = () => {
    setCarryDue(true);
    setMethod("cash");
    onClose();
  };

  return (
    <Modal
      open={Boolean(service)}
      onClose={handleClose}
      title="Resume this service?"
      description={service ? `${service.patientName} — ${service.serviceName}` : undefined}
    >
      {service && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Stopped after</span>
              <span className="font-medium text-text-primary">
                {service.terminatedMonthLabel}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Monthly fee</span>
              <span className="font-medium text-text-primary">
                {formatCurrency(service.monthlyFee)}
              </span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-text-secondary">Previous due</span>
              <span
                className={clsx(
                  "text-lg font-semibold",
                  hasDue ? "text-danger" : "text-text-primary",
                )}
              >
                {formatCurrency(previousDue)}
              </span>
            </div>
            {service.unpaidMonths.length > 0 && (
              <p className="text-xs text-text-secondary">
                Unpaid: {service.unpaidMonths.join(", ")}
              </p>
            )}
          </div>

          {hasDue ? (
            <div className="flex flex-col gap-2">
              <ResumeOption
                selected={carryDue}
                onSelect={() => setCarryDue(true)}
                title="Pay the previous due, then resume"
                detail={`Collect ${formatCurrency(previousDue)} now — one receipt per unpaid month — and the service restarts once it is paid.`}
              />
              <ResumeOption
                selected={!carryDue}
                onSelect={() => setCarryDue(false)}
                tone="danger"
                title="Resume without the previous due"
                detail={`Skip ${formatCurrency(previousDue)} and start a fresh cycle. Those months are written off — they leave Outstanding Due for good and cannot be collected later. Recorded in the audit log.`}
              />
            </div>
          ) : (
            <p className="text-sm text-text-secondary">
              {service.terminatedKind === "manual"
                ? "Nothing is outstanding — stopping this service already wrote off what was owed."
                : "Nothing is outstanding on this service."}
            </p>
          )}

          {carryDue && hasDue && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-text-primary">Payment method</p>
              <PaymentMethodSelector value={method} onChange={setMethod} />
            </div>
          )}

          {!carryDue && hasDue && (
            <div className="flex gap-3 rounded-lg border border-danger/30 bg-danger/5 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
              <p className="text-xs text-text-secondary">
                Skipping is final: {formatCurrency(previousDue)} across{" "}
                {service.unpaidMonths.length}{" "}
                {service.unpaidMonths.length === 1 ? "month" : "months"} will never be
                collectable again.
              </p>
            </div>
          )}

          <p className="text-sm text-text-primary">
            Billing restarts from this month. The months the patient was away are not
            charged.
          </p>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose} disabled={isResuming}>
              Cancel
            </Button>
            <Button
              variant={carryDue ? "primary" : "danger"}
              isLoading={isResuming}
              onClick={() => onConfirm({ carryDue, method })}
            >
              {carryDue && hasDue
                ? `Collect ${formatCurrency(previousDue)} & Resume`
                : "Confirm Resume"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function ResumeOption({
  selected,
  onSelect,
  title,
  detail,
  tone = "primary",
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  detail: string;
  tone?: "primary" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={clsx(
        "flex gap-3 rounded-lg border p-3 text-left transition-colors",
        selected
          ? tone === "danger"
            ? "border-danger bg-danger/5"
            : "border-primary bg-primary-light/50"
          : "border-border hover:border-primary/40",
      )}
    >
      <span
        className={clsx(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
          selected
            ? tone === "danger"
              ? "border-danger bg-danger text-white"
              : "border-primary bg-primary text-white"
            : "border-border",
        )}
      >
        {selected && <Check className="h-3 w-3" />}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-text-primary">{title}</span>
        <span className="text-xs text-text-secondary">{detail}</span>
      </span>
    </button>
  );
}
