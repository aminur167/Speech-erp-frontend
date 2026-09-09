"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/currency";
import type { OutstandingDueItem } from "@/lib/api/monthlyEnrollments";

/**
 * Why a new enrollment or a reactivation is blocked, and what to do about it.
 *
 * The rule is enforced on the server; this exists so the manager is told which
 * months and how much *before* pressing the button, rather than being refused
 * afterwards. It is one component because both places have to say the same
 * thing — a patient who is told a different figure on two screens will be told
 * a third by the person at the desk.
 */
export function OutstandingDueNotice({
  items,
  total,
  className,
}: {
  items: OutstandingDueItem[];
  total: number;
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
          <p className="text-xs text-text-secondary">
            Please clear the due payments before enrolling a new service or
            activating an existing service.
          </p>
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
