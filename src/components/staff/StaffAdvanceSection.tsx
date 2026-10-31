"use client";

import { useState } from "react";
import { HandCoins } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { useStaffAdvances, useRequestAdvance } from "@/hooks/staff/useStaffAdvances";
import { formatCurrency } from "@/utils/currency";
import { humanizeField } from "@/utils/fields";
import type { StaffAdvanceStatus } from "@/lib/api/staff";
import type { StaffMember } from "@/types/domain";

const STATUS_TONE: Record<StaffAdvanceStatus, "info" | "warning" | "success" | "danger"> = {
  pending_approval: "warning",
  approved: "info",
  rejected: "danger",
  paid: "success",
};

/**
 * Salary paid early, and what is still to come back out of it.
 *
 * Sits beside Bonuses because both are money the desk decides about one
 * person at a time — but they are opposites, and the screen says so: a bonus
 * adds to next month's payable, an advance subtracts from it until it is
 * clear.
 *
 * Only requests. Admin approves on their own queue and the Payroll tab pays
 * it out, the same split the salary workflow already has.
 */
export function StaffAdvanceSection({
  staff,
  branchId,
}: {
  staff: StaffMember;
  branchId?: string;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const { data: advances, isLoading } = useStaffAdvances(branchId, staff.id);
  const requestAdvance = useRequestAdvance();

  // Paid ones only, matching the server: an advance still waiting on Admin
  // is not money the person has, so calling it "to recover" would show a
  // debt that does not exist yet.
  const outstanding = (advances ?? [])
    .filter((advance) => advance.status === "paid")
    .reduce((sum, advance) => sum + advance.outstanding, 0);

  const parsed = Number(amount);
  const amountError =
    amount.trim() !== "" && (!Number.isFinite(parsed) || parsed <= 0)
      ? "Enter an amount above zero."
      : undefined;
  const canSubmit = Number.isFinite(parsed) && parsed > 0 && reason.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    requestAdvance.mutate(
      { staffId: staff.id, amount: parsed, reason: reason.trim() },
      {
        onSuccess: () => {
          setIsAdding(false);
          setAmount("");
          setReason("");
        },
      },
    );
  };

  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
        Advances
      </h3>
      <div className="rounded-lg border border-border p-2.5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-text-secondary">
            {isLoading
              ? "Loading advances…"
              : outstanding > 0
                ? `${formatCurrency(outstanding)} still to recover from salary`
                : advances && advances.length > 0
                  ? "All advances recovered."
                  : "No advances given yet."}
          </p>
          {!isAdding && (
            <Button
              variant="secondary"
              className="shrink-0 px-2 py-1 text-xs"
              onClick={() => setIsAdding(true)}
            >
              <HandCoins className="h-3 w-3" />
              Give Advance
            </Button>
          )}
        </div>

        {isAdding && (
          <div className="mt-2 flex flex-col gap-1.5 border-t border-border pt-2">
            <Input
              label="Advance Amount (BDT)"
              placeholder="e.g. 5000"
              type="number"
              step="0.01"
              min={0}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              error={amountError}
            />
            {/* Required, not optional like a bonus reason could have been:
                the server refuses without one. An unexplained early payment
                is exactly what an audit asks about. */}
            <Textarea
              label="Reason"
              requiredMark
              placeholder="e.g. Medical emergency"
              rows={2}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
            <p className="text-[11px] text-text-secondary">
              Goes to Admin for approval. Once paid, it comes off future
              salary automatically, oldest first.
            </p>
            <div className="flex justify-end gap-1.5">
              <Button
                variant="ghost"
                className="px-2 py-1 text-xs"
                onClick={() => {
                  setIsAdding(false);
                  setAmount("");
                  setReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="px-2 py-1 text-xs"
                disabled={!canSubmit}
                isLoading={requestAdvance.isPending}
                onClick={submit}
              >
                Request Advance
              </Button>
            </div>
          </div>
        )}

        {advances && advances.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1.5 border-t border-border pt-2">
            {advances.map((advance) => (
              <li key={advance.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs text-text-primary">{advance.reason}</p>
                  <p className="text-[11px] text-text-secondary">
                    {new Date(advance.createdAt).toLocaleDateString()}
                    {advance.status === "paid" && advance.outstanding > 0 && (
                      <> · {formatCurrency(advance.outstanding)} left</>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs tabular-nums text-text-primary">
                    {formatCurrency(advance.amount)}
                  </span>
                  <Badge
                    tone={STATUS_TONE[advance.status]}
                    label={humanizeField(advance.status)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
