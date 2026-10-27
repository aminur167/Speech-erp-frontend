"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/currency";
import type { OutstandingDueItem } from "@/lib/api/monthlyEnrollments";

/**
 * What a patient owes, itemised, where that balance is standing in the way.
 *
 * One component because the figure has to be the same wherever it appears — a
 * patient told a different amount on two screens will be told a third by the
 * person at the desk. What differs is *why* it matters, so the caller says
 * that: reactivating a service and taking an advance are blocked by different
 * rules, and since 2026-10-27 starting a *new* service is blocked only by
 * that service's own due (see EnrollmentEligibilityNotice, which is what the
 * enrolment screens use).
 */
export function OutstandingDueNotice({
  items,
  total,
  message,
  className,
}: {
  items: OutstandingDueItem[];
  total: number;
  /** Why this balance is in the way here. Required — there is no rule that
   *  applies to every screen any more. */
  message: string;
  className?: string;
}) {
  const router = useRouter();

  if (total <= 0) return null;

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border border-danger/30 bg-danger/5 p-4 ${className ?? ""}`}
    >
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-text-primary">
            This patient has outstanding due payments
          </p>
          <p className="text-xs text-text-secondary">{message}</p>
        </div>
      </div>

      <ul className="flex flex-col gap-1 border-t border-danger/20 pt-3 text-sm">
        {items.map((item) => (
          <li key={`${item.type}-${item.itemId}`} className="flex justify-between gap-3">
            <span className="text-text-secondary">
              {item.label}
              <span className="text-text-secondary/70"> · {item.serviceName}</span>
              {!item.serviceActive && (
                <span className="text-text-secondary/70"> (inactive service)</span>
              )}
            </span>
            <span className="tabular-nums text-text-primary">
              {formatCurrency(item.amount)}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-danger/20 pt-3">
        <span className="text-sm font-medium text-text-primary">
          Total Due: {formatCurrency(total)}
        </span>
        <Button
          variant="secondary"
          className="px-3 py-1.5 text-xs"
          onClick={() => router.push("/manager/due-payments")}
        >
          Go to Due Payments
        </Button>
      </div>
    </div>
  );
}
