"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { StaffAvatar } from "@/components/staff/StaffAvatar";
import { LoadingState } from "@/components/ui/states";
import { useAdvances, useReviewAdvance } from "@/hooks/staff/useStaffAdvances";
import { formatCurrency } from "@/utils/currency";
import type { StaffAdvance } from "@/lib/api/staff";

/**
 * Salary advances waiting on Admin, on the same page as the salary queue.
 *
 * Its own section rather than rows merged into that list: the two are
 * different models with different shapes — an advance has a reason and a
 * running balance, a salary request has a month — and interleaving them
 * would have meant a paginated list that pages two backends at once.
 *
 * Hidden entirely when nothing is waiting, so the page looks the way it did
 * on the days nobody asked for an advance.
 */
export function AdvanceApprovalsSection() {
  const [rejecting, setRejecting] = useState<StaffAdvance | null>(null);
  const [note, setNote] = useState("");

  const { data: advances, isLoading } = useAdvances({ status: "pending_approval" });
  const review = useReviewAdvance();

  if (isLoading) return <LoadingState label="Loading advances…" />;
  if (!advances || advances.length === 0) return null;

  const closeReject = () => {
    setRejecting(null);
    setNote("");
  };

  return (
    <>
      <div className="flex flex-col gap-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Advance Requests — {advances.length} waiting
        </h2>
        <Card>
          <div className="flex flex-col">
            {advances.map((advance) => (
              <div
                key={advance.id}
                className="flex items-center justify-between gap-3 border-b border-l-4 border-border border-l-warning px-3 py-2.5 last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <StaffAvatar
                    name={advance.staffName}
                    photoUrl={advance.staffPhotoUrl}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {advance.staffName}
                      <span className="ml-2 font-normal text-text-secondary">
                        {advance.branchName}
                      </span>
                    </p>
                    <p className="truncate text-xs text-text-secondary">
                      {advance.reason}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <Badge tone="warning" label="Advance" />
                  <span className="text-sm font-medium tabular-nums text-text-primary">
                    {formatCurrency(advance.amount)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRejecting(advance)}
                      className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-danger/40 hover:text-danger"
                    >
                      <X className="h-3.5 w-3.5" />
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        review.mutate({ advanceId: advance.id, approve: true })
                      }
                      className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-dark"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal
        open={Boolean(rejecting)}
        onClose={closeReject}
        title="Reject this advance?"
        description={
          rejecting
            ? `${rejecting.staffName} — ${formatCurrency(rejecting.amount)}`
            : undefined
        }
        size="md"
      >
        <div className="flex flex-col gap-3">
          {/* The server refuses a rejection without one: the manager has to
              know why before asking again. */}
          <Textarea
            label="Reason"
            requiredMark
            rows={3}
            placeholder="e.g. Already has an advance outstanding this month"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeReject}>
              Cancel
            </Button>
            <Button
              disabled={!note.trim()}
              isLoading={review.isPending}
              onClick={() =>
                rejecting &&
                review.mutate(
                  {
                    advanceId: rejecting.id,
                    approve: false,
                    reviewNote: note.trim(),
                  },
                  { onSuccess: closeReject },
                )
              }
            >
              Reject
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
