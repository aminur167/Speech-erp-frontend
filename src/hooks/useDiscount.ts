"use client";

import { useState } from "react";
import { formatCurrency } from "@/utils/currency";

export interface Discount {
  /** As typed. Text, not a number — see below. */
  text: string;
  setText: (value: string) => void;
  reason: string;
  setReason: (value: string) => void;
  /** The parsed amount, 0 when the field is empty or unparseable. */
  value: number;
  /** The charge less the discount, never below zero. */
  net: number;
  amountError?: string;
  reasonError?: string;
  /** False while either field is wrong — the Confirm button reads this. */
  isValid: boolean;
  /** What to send: `undefined` when nothing was discounted. */
  payload: { discount: number; discountReason: string } | undefined;
  reset: () => void;
}

/**
 * One discount field, validated the way the server will validate it.
 *
 * A discount can be given in six places now. The parse-and-check logic was
 * copied into three of them and about to be copied into three more, so it
 * lives here instead: the messages, the zero-and-above rule and the
 * required reason are the same wherever a manager types a discount, and the
 * server's own rule (apps/common/discounts.py) is the one being mirrored.
 *
 * The amount is kept as **text**, deliberately. Held as a number, a
 * half-typed "12." parses to 12 and gets rewritten under the manager's
 * cursor mid-keystroke; parsing happens here, where it is used.
 */
export function useDiscount({
  charge,
  ceiling,
  what,
}: {
  /** What is being charged. `net` is this less the discount. */
  charge: number;
  /**
   * The largest discount allowed, when that is not the whole charge. A
   * daily session and a counter sale stop a paisa short, because there is
   * no bill to record a free one on — but they still *charge* the full
   * amount, which is why this is a separate figure. Conflating the two
   * printed "to collect 599.99" on a 200 discount off an 800 fee.
   */
  ceiling?: number;
  /** Names the charge in the message: "admit fee", "cart total". */
  what: string;
}): Discount {
  const [text, setText] = useState("");
  const [reason, setReason] = useState("");

  const limit = ceiling ?? charge;
  const parsed = text.trim() === "" ? 0 : Number(text);
  const value = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  const net = Math.max(0, charge - value);

  let amountError: string | undefined;
  if (!Number.isFinite(parsed) || parsed < 0) {
    amountError = "Enter a discount of 0 or more.";
  } else if (parsed > limit) {
    amountError = `The discount cannot be more than the ${what} (${formatCurrency(limit)}).`;
  }

  const reasonError =
    value > 0 && !reason.trim() ? "Say why the discount is being given." : undefined;

  return {
    text,
    setText,
    reason,
    setReason,
    value,
    net,
    amountError,
    reasonError,
    isValid: !amountError && !reasonError,
    payload: value > 0 ? { discount: value, discountReason: reason.trim() } : undefined,
    reset: () => {
      setText("");
      setReason("");
    },
  };
}
