"use client";

import { clsx } from "clsx";
import { Check } from "lucide-react";
import { LoadingState } from "@/components/ui/states";
import { formatCurrency } from "@/utils/currency";
import type { AdvanceMonthOption } from "@/lib/api/monthlyEnrollments";

/**
 * The future months a manager may tick, one by one.
 *
 * A list of ticks rather than a "pay through" range, because October and
 * December with November deliberately left alone is a real choice a patient
 * makes and a range cannot express it. A month that is already settled is
 * shown and disabled rather than hidden — "December is already paid" is the
 * answer the manager came for, and an absent row does not give it.
 */
export function AdvanceMonthPicker({
  months,
  selected,
  onToggle,
  isLoading,
  disabled,
}: {
  months: AdvanceMonthOption[];
  selected: string[];
  onToggle: (month: string) => void;
  isLoading?: boolean;
  /** Set while something is still owed — nothing may be paid ahead until then. */
  disabled?: boolean;
}) {
  if (isLoading) return <LoadingState label="Loading future months…" />;
  if (months.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {months.map((month) => {
        const isSelected = selected.includes(month.month);
        const unavailable = month.covered || disabled;

        return (
          <button
            key={month.month}
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            disabled={unavailable}
            onClick={() => onToggle(month.month)}
            className={clsx(
              "flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors",
              unavailable
                ? "cursor-not-allowed border-border bg-background opacity-60"
                : isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50",
            )}
          >
            <span className="flex items-center gap-3">
              <span
                className={clsx(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                  isSelected ? "border-primary bg-primary" : "border-border",
                )}
              >
                {isSelected && <Check className="h-3 w-3 text-white" />}
              </span>
              <span>
                <span className="block text-sm font-medium text-text-primary">
                  {month.label}
                </span>
                {month.covered && (
                  <span className="block text-xs text-success">Advance paid</span>
                )}
              </span>
            </span>
            <span className="text-sm tabular-nums text-text-secondary">
              {formatCurrency(month.amount)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
