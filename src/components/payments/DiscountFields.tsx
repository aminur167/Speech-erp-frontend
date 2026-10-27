"use client";

import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { Discount } from "@/hooks/useDiscount";

/**
 * The discount amount, and the reason it asks for once there is one.
 *
 * Paired with `useDiscount`, which holds the state and the validation. The
 * reason only appears after a discount is typed: an empty box marked
 * required on every payment screen reads as a field somebody forgot to
 * fill, and a manager taking the full fee has nothing to explain.
 */
export function DiscountFields({
  discount,
  max,
  reasonPlaceholder,
  label = "Discount (৳)",
}: {
  discount: Discount;
  /** The browser's own spinner limit. The real check is in `useDiscount`. */
  max: number;
  reasonPlaceholder: string;
  label?: string;
}) {
  return (
    <>
      <Input
        label={label}
        type="number"
        inputMode="decimal"
        min={0}
        max={max}
        step="0.01"
        placeholder="0"
        value={discount.text}
        onChange={(event) => discount.setText(event.target.value)}
        error={discount.amountError}
      />
      {discount.value > 0 && (
        <Textarea
          label="Reason for discount"
          requiredMark
          rows={2}
          placeholder={reasonPlaceholder}
          value={discount.reason}
          onChange={(event) => discount.setReason(event.target.value)}
          error={discount.reasonError}
        />
      )}
    </>
  );
}
