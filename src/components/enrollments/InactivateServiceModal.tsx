"use client";

import { useState } from "react";
import { AlertTriangle, Wallet } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/states";
import {
  useInactivatePreview,
  useInactivateService,
  type ServiceKind,
} from "@/hooks/enrollments/useInactivateService";
import { formatCurrency } from "@/utils/currency";
import type { StopDecision } from "@/lib/api/monthlyEnrollments";

type Decision = "keep" | "cancel";

/**
 * Making one service inactive, deciding each outstanding month separately.
 *
 * **Ticked keeps the due, unticked cancels it** — and neither is the starting
 * position. A box that arrives pre-ticked is an implicit "keep everything",
 * one that arrives clear is an implicit "cancel everything", and thousands of
 * taka get forgiven by accident that way. So each box starts indeterminate,
 * the row says so in words, and Confirm stays disabled until every month has
 * been answered.
 *
 * Every cancelled month also needs a reason typed against it, because the
 * record exists so Admin can see *why* the amount owed dropped. Without one it
 * records that money vanished and nothing else.
 *
 * Only this service stops. The patient's other services keep running, and the
 * patient record itself is untouched.
 */
export function InactivateServiceModal({
  kind,
  serviceRefId,
  patientName,
  serviceName,
  onClose,
  onInactivated,
}: {
  kind: ServiceKind;
  /** Null closes the dialog. */
  serviceRefId: string | null;
  patientName: string;
  serviceName: string;
  onClose: () => void;
  onInactivated?: () => void;
}) {
  const { data: preview, isLoading } = useInactivatePreview(
    kind,
    serviceRefId ?? undefined,
  );
  const inactivate = useInactivateService();

  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  // A different service means a different set of months to answer for, so the
  // answers reset. Adjusted during render rather than in an effect — React's
  // own guidance for state that depends on a prop, and it avoids the extra
  // pass where the old service's decisions are briefly shown against the new
  // one's months.
  const [answeringFor, setAnsweringFor] = useState(serviceRefId);
  if (serviceRefId !== answeringFor) {
    setAnsweringFor(serviceRefId);
    setDecisions({});
    setReasons({});
    setReason("");
    setError(null);
  }

  const owed = preview?.owed ?? [];
  const allDecided = owed.every((row) => decisions[row.billId]);
  const cancelMissingReason = owed.some(
    (row) => decisions[row.billId] === "cancel" && !(reasons[row.billId] ?? "").trim(),
  );

  const keptTotal = owed
    .filter((row) => decisions[row.billId] === "keep")
    .reduce((running, row) => running + row.amount, 0);
  const cancelledTotal = owed
    .filter((row) => decisions[row.billId] === "cancel")
    .reduce((running, row) => running + row.amount, 0);

  const confirm = () => {
    if (!serviceRefId) return;

    // "cancel" is the manager's word for it; the API keeps calling it a waive.
    const payload: StopDecision[] = owed.map((row) => ({
      billId: row.billId,
      action: decisions[row.billId] === "cancel" ? "waive" : "keep",
      reason: reasons[row.billId],
    }));

    inactivate.mutate(
      { kind, serviceRefId, decisions: payload, reason },
      {
        onSuccess: () => {
          onInactivated?.();
          onClose();
        },
        onError: (failure) => setError(failure.message),
      },
    );
  };

  return (
    <Modal
      open={Boolean(serviceRefId)}
      onClose={onClose}
      title="Make this service inactive?"
      description={`${patientName} — ${serviceName}`}
    >
      {isLoading && <LoadingState label="Checking what is outstanding…" />}

      {!isLoading && preview && (
        <div className="flex flex-col gap-4">
          {owed.length === 0 ? (
            <p className="text-sm text-text-primary">
              Nothing is outstanding. The service becomes inactive and no further
              bills are raised. The patient&rsquo;s other services keep running.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-text-primary">
                Outstanding dues
              </p>
              <p className="-mt-1 text-xs text-text-secondary">
                Tick a month to <strong>keep</strong> the due. Leave it unticked to{" "}
                <strong>cancel</strong> it.
              </p>

              {owed.map((row) => {
                const decision = decisions[row.billId];
                return (
                  <div
                    key={row.billId}
                    className="flex flex-col gap-2 rounded-lg border border-border p-3"
                  >
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 shrink-0 accent-primary"
                        checked={decision === "keep"}
                        // Undecided is a real third state, not a styling
                        // choice — it is what stops a default being applied
                        // to money nobody looked at.
                        ref={(node) => {
                          if (node) node.indeterminate = !decision;
                        }}
                        onChange={(event) =>
                          setDecisions((current) => ({
                            ...current,
                            [row.billId]: event.target.checked ? "keep" : "cancel",
                          }))
                        }
                      />
                      <span className="flex-1">
                        <span className="block text-sm font-medium text-text-primary">
                          {row.label}
                        </span>
                        <span className="block text-xs text-text-secondary">
                          {formatCurrency(row.amount)} outstanding
                        </span>
                      </span>
                      <span
                        className={
                          decision === "keep"
                            ? "text-xs font-medium text-success"
                            : decision === "cancel"
                              ? "text-xs font-medium text-danger"
                              : "text-xs font-medium text-warning"
                        }
                      >
                        {decision === "keep"
                          ? "Keep"
                          : decision === "cancel"
                            ? "Cancel"
                            : "Not decided"}
                      </span>
                    </label>

                    {decision === "cancel" && (
                      <Input
                        value={reasons[row.billId] ?? ""}
                        onChange={(event) =>
                          setReasons((current) => ({
                            ...current,
                            [row.billId]: event.target.value,
                          }))
                        }
                        placeholder="Why is this due being cancelled? (required)"
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

          {owed.length > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Keeping</span>
                <span className="font-medium tabular-nums text-text-primary">
                  {formatCurrency(keptTotal)}
                </span>
              </div>
              <p className="-mt-1 text-xs text-text-secondary">
                Still owed. Collect it on Due Payments — the service cannot be
                reactivated until it is cleared.
              </p>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-text-secondary">Cancelling</span>
                <span className="text-lg font-semibold tabular-nums text-danger">
                  {formatCurrency(cancelledTotal)}
                </span>
              </div>
              <p className="-mt-1 text-xs text-text-secondary">
                Marked cancelled and kept in the record, with your reason, in the
                audit log.
              </p>
            </div>
          )}

          <Input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Why is the service being made inactive? (optional)"
          />

          {cancelMissingReason && (
            <div className="flex gap-2 text-xs text-danger">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                Every cancelled month needs a reason — that is what tells Admin why
                the amount owed went down.
              </span>
            </div>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={inactivate.isPending}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={inactivate.isPending}
              disabled={!allDecided || cancelMissingReason}
              onClick={confirm}
            >
              {cancelledTotal > 0
                ? `Confirm inactive & cancel ${formatCurrency(cancelledTotal)}`
                : "Confirm inactive"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
