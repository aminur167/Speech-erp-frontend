"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { ArrowDownLeft, ArrowUpRight, Ban, Minus, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RowDetailDrawer } from "@/components/ui/RowDetailDrawer";
import { formatCurrency } from "@/utils/currency";
import { cameFromControl } from "@/utils/interactiveClick";
import { humanizeField } from "@/utils/fields";
import type { TransactionItem } from "@/lib/api/transactions";
import type { Expense } from "@/types/domain";

/** A payment can only be voided or refunded while it's still money that actually moved. */
const ACTIONABLE_STATUSES = new Set(["paid", "partial"]);

export type TransactionDirection = "in" | "out" | "void";

/**
 * Mirrors the same rule the summary cards' totals use (apps/reporting):
 * revenue excludes only VOID, refunds are their own tracked total. A voided
 * payment never happened, so it's neither money in nor money out.
 */
export function transactionDirection(transaction: TransactionItem): TransactionDirection {
  if (transaction.status === "void") return "void";
  if (transaction.status === "refunded") return "out";
  return "in";
}

type FeedEntry =
  | { kind: "payment"; id: string; amount: number; createdAt: string; item: TransactionItem }
  | { kind: "expense"; id: string; amount: number; createdAt: string; item: Expense };

/** One list, oldest-first ordering undone: the most recent thing that happened sits on top. */
function sortByRecency(entries: FeedEntry[]): FeedEntry[] {
  return [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/**
 * A minimal, wallet-style feed row per transaction: a direction icon, who and
 * what on the left, the signed amount and when on the right. Replaces the
 * dense table on the main Transaction History page, where a manager scans
 * many rows at a glance rather than compares columns.
 *
 * Mixes in expenses (salaries included, since a disbursed salary is an
 * Expense) alongside payments — "Out" means everything that actually left
 * the branch, not just refunds, matching the summary cards above it.
 */
export function TransactionFeed({
  transactions,
  expenses = [],
  canVoid,
  canRequestRefund,
  onVoid,
  onRequestRefund,
}: {
  transactions: TransactionItem[];
  /** Approved/pending only — a rejected expense never happened, same reasoning as a void payment. */
  expenses?: Expense[];
  /** Manager (same-day, enforced server-side) or Admin (any day). */
  canVoid?: boolean;
  /** Manager only — opens a request an Admin must approve. */
  canRequestRefund?: boolean;
  onVoid?: (transaction: TransactionItem) => void;
  onRequestRefund?: (transaction: TransactionItem) => void;
}) {
  const [selected, setSelected] = useState<FeedEntry | null>(null);

  const entries = sortByRecency([
    ...transactions.map(
      (item): FeedEntry => ({ kind: "payment", id: item.id, amount: item.amount, createdAt: item.createdAt, item }),
    ),
    ...expenses.map(
      (item): FeedEntry => ({ kind: "expense", id: item.id, amount: item.amount, createdAt: item.createdAt, item }),
    ),
  ]);

  const selectedPayment = selected?.kind === "payment" ? selected.item : null;
  const selectedActionable = Boolean(selectedPayment && ACTIONABLE_STATUSES.has(selectedPayment.status));

  return (
    <div className="flex flex-col">
      {entries.map((entry) => {
        const direction: TransactionDirection =
          entry.kind === "expense" ? "out" : transactionDirection(entry.item);
        const title = entry.kind === "expense" ? entry.item.description : entry.item.patientName;
        const subtitle =
          entry.kind === "expense" ? entry.item.expenseCode : entry.item.receiptNumber;

        return (
          <div
            key={`${entry.kind}-${entry.id}`}
            onClick={(event) => {
              if (cameFromControl(event)) return;
              setSelected(entry);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              if (cameFromControl(event)) return;
              event.preventDefault();
              setSelected(entry);
            }}
            tabIndex={0}
            title="View full details"
            className="flex cursor-pointer items-center gap-3 border-b border-border/60 py-3 transition-colors last:border-0 hover:bg-primary-light/40 focus:outline-none focus-visible:bg-primary-light/40"
          >
            <div
              className={clsx(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                direction === "out" && "bg-danger/10 text-danger",
                direction === "in" && "bg-success/10 text-success",
                direction === "void" && "bg-text-secondary/10 text-text-secondary",
              )}
            >
              {direction === "out" && <ArrowUpRight className="h-5 w-5" />}
              {direction === "in" && <ArrowDownLeft className="h-5 w-5" />}
              {direction === "void" && <Minus className="h-5 w-5" />}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-text-primary">
                {entry.kind === "expense" ? humanizeField(entry.item.category) : title}
              </p>
              <p className="truncate font-mono text-xs text-text-secondary">{subtitle}</p>
            </div>

            <div className="shrink-0 text-right">
              <p
                className={clsx(
                  "font-semibold",
                  direction === "out" && "text-danger",
                  direction === "in" && "text-success",
                  direction === "void" && "text-text-secondary line-through",
                )}
              >
                {direction === "out" ? "−" : direction === "in" ? "+" : ""}
                {formatCurrency(entry.amount)}
              </p>
              <p className="text-xs text-text-secondary">
                {new Date(entry.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        );
      })}

      <RowDetailDrawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={
          selected
            ? selected.kind === "expense"
              ? selected.item.expenseCode
              : selected.item.receiptNumber
            : ""
        }
        subtitle={
          selected
            ? selected.kind === "expense"
              ? selected.item.description
              : selected.item.patientName
            : undefined
        }
        data={selected?.item ?? null}
        footer={
          selectedPayment && selectedActionable && (canVoid || canRequestRefund) ? (
            <div className="flex gap-2">
              {canRequestRefund && (
                <Button
                  variant="secondary"
                  className="flex-1 justify-center"
                  onClick={() => {
                    onRequestRefund?.(selectedPayment);
                    setSelected(null);
                  }}
                >
                  <Undo2 className="h-4 w-4" />
                  Request refund
                </Button>
              )}
              {canVoid && (
                <Button
                  variant="danger"
                  className="flex-1 justify-center"
                  onClick={() => {
                    onVoid?.(selectedPayment);
                    setSelected(null);
                  }}
                >
                  <Ban className="h-4 w-4" />
                  Void payment
                </Button>
              )}
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
