"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { AlertTriangle, Wallet } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/states";
import { useStopPreview, useStopMonthlyService } from "@/hooks/enrollments/useStopMonthlyService";
import { formatCurrency } from "@/utils/currency";
import type { StopDecision } from "@/lib/api/monthlyEnrollments";

type Action = "keep" | "waive";

/**
 * Stopping one service, deciding each unpaid month separately.
 *
 * No decision is pre-selected. Defaulting to keep quietly leaves a debt the
 * manager thought they had forgiven; defaulting to waive is how thousands of
 * taka get written off by accident. So Confirm stays disabled until every
 * month has been answered — and every waive needs a reason typed against it,
 * because the record exists so Admin can see *why* the amount owed dropped.
 */
export function StopServiceModal({
  enrollmentId,
  patientName,
  serviceName,
  onClose,
  onStopped,
}: {
  /** Null closes the dialog. */
  enrollmentId: string | null;
  patientName: string;
  serviceName: string;
  onClose: () => void;
  onStopped?: () => void;
}) {
  const { data: preview, isLoading } = useStopPreview(enrollmentId ?? undefined);
  const stopService = useStopMonthlyService();

  const [actions, setActions] = useState<Record<string, Action>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  // A different service means a different set of months to answer for, so the
  // answers reset. Adjusted during render rather than in an effect — React's
  // own guidance for state that depends on a prop, and it avoids the extra
  // pass where the old service's decisions are briefly shown against the new
  // one's months.
  const [answeringFor, setAnsweringFor] = useState(enrollmentId);
  if (enrollmentId !== answeringFor) {
    setAnsweringFor(enrollmentId);
    setActions({});
    setReasons({});
    setReason("");
    setError(null);
  }

  const owed = preview?.owed ?? [];
  const decided = owed.every((month) => actions[month.billId]);
  const waivedMissingReason = owed.some(
    (month) => actions[month.billId] === "waive" && !(reasons[month.billId] ?? "").trim(),
  );

  const keptTotal = owed
    .filter((month) => actions[month.billId] === "keep")
    .reduce((running, month) => running + month.amount, 0);
  const waivedTotal = owed
    .filter((month) => actions[month.billId] === "waive")
    .reduce((running, month) => running + month.amount, 0);

  const confirm = () => {
    if (!enrollmentId) return;

    const decisions: StopDecision[] = owed.map((month) => ({
      billId: month.billId,
      action: actions[month.billId],
      reason: reasons[month.billId],
    }));

    stopService.mutate(
      { enrollmentId, decisions, reason },
      {
        onSuccess: () => {
          onStopped?.();
          onClose();
        },
        onError: (failure) => setError(failure.message),
      },
    );
  };

  return (
    <Modal
      open={Boolean(enrollmentId)}
      onClose={onClose}
      title="Stop this service?"
      description={`${patientName} — ${serviceName}`}
    >
      {isLoading && <LoadingState label="Checking what is outstanding…" />}

      {!isLoading && preview && (
        <div className="flex flex-col gap-4">
          {owed.length === 0 ? (
            <p className="text-sm text-text-primary">
              Nothing is outstanding. Stopping ends the service and no further bills
              are raised.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-text-primary">
                Decide each unpaid month
              </p>
              {owed.map((month) => {
                const action = actions[month.billId];
                return (
                  <div
                    key={month.billId}
                    className="flex flex-col gap-2 rounded-lg border border-border p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {month.label}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {formatCurrency(month.amount)} outstanding
                        </p>
                      </div>
                      <div className="flex gap-1 rounded-lg border border-border bg-background p-1">
                        {(["keep", "waive"] as const).map((option) => (
                          <button
                            key={option}
                            type="button"
                            aria-pressed={action === option}
                            onClick={() =>
                              setActions((current) => ({
                                ...current,
                                [month.billId]: option,
                              }))
                            }
                            className={clsx(
                              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                              action === option
                                ? option === "waive"
                                  ? "bg-danger text-white"
                                  : "bg-surface text-text-primary shadow-sm"
                                : "text-text-secondary hover:text-text-primary",
                            )}
                          >
                            {option === "keep" ? "Keep the due" : "Waive it"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {action === "waive" && (
                      <Input
                        value={reasons[month.billId] ?? ""}
                        onChange={(event) =>
                          setReasons((current) => ({
                            ...current,
                            [month.billId]: event.target.value,
                          }))
                        }
                        placeholder="Why is this month being waived? (required)"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {preview.prepaid.length > 0 && (
            <div className="flex gap-3 rounded-lg border border-warning/30 bg-warning/5 p-3">
              <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-text-primary">
                  {formatCurrency(preview.prepaidTotal)} already paid in advance
                </p>
                <p className="text-xs text-text-secondary">
                  {preview.prepaid.map((month) => month.label).join(", ")}. The money
                  stays as credit — if the patient comes back, those months are already
                  settled. To give it back instead, raise a refund request, which Admin
                  approves.
                </p>
              </div>
            </div>
          )}

          {preview.droppedMonths.length > 0 && (
            <p className="text-xs text-text-secondary">
              {preview.droppedMonths.join(", ")} — not yet payable, so{" "}
              {preview.droppedMonths.length === 1 ? "it is" : "they are"} simply
              dropped rather than decided.
            </p>
          )}

          {owed.length > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Keeping</span>
                <span className="font-medium tabular-nums text-text-primary">
                  {formatCurrency(keptTotal)}
                </span>
              </div>
              <p className="-mt-1 text-xs text-text-secondary">
                Still collectable if the service is resumed.
              </p>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-text-secondary">Waiving</span>
                <span className="text-lg font-semibold tabular-nums text-danger">
                  {formatCurrency(waivedTotal)}
                </span>
              </div>
              <p className="-mt-1 text-xs text-text-secondary">
                Gone for good, and recorded in the audit log with your reason.
              </p>
            </div>
          )}

          <Input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Why is the service being stopped? (optional)"
          />

          {waivedMissingReason && (
            <div className="flex gap-2 text-xs text-danger">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                Every waived month needs a reason — that is what tells Admin why the
                amount owed went down.
              </span>
            </div>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={stopService.isPending}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={stopService.isPending}
              disabled={!decided || waivedMissingReason}
              onClick={confirm}
            >
              {waivedTotal > 0
                ? `Stop service & waive ${formatCurrency(waivedTotal)}`
                : "Stop service"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
