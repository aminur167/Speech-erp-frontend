"use client";

import { clsx } from "clsx";
import { ArrowDownLeft, ArrowUpRight, Ban, Minus, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RowDetailDrawer, useRowDetail } from "@/components/ui/RowDetailDrawer";
import { formatCurrency } from "@/utils/currency";
import { cameFromControl } from "@/utils/interactiveClick";
import type { TransactionItem } from "@/lib/api/transactions";

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

/**
 * A minimal, wallet-style feed row per transaction: a direction icon, who and
 * what on the left, the signed amount and when on the right. Replaces the
 * dense table on the main Transaction History page, where a manager scans
 * many rows at a glance rather than compares columns.
 */
export function TransactionFeed({
  transactions,
  canVoid,
  canRequestRefund,
  onVoid,
  onRequestRefund,
}: {
  transactions: TransactionItem[];
  /** Manager (same-day, enforced server-side) or Admin (any day). */
  canVoid?: boolean;
  /** Manager only — opens a request an Admin must approve. */
  canRequestRefund?: boolean;
  onVoid?: (transaction: TransactionItem) => void;
  onRequestRefund?: (transaction: TransactionItem) => void;
}) {
  const detail = useRowDetail<TransactionItem>();
  const selected = detail.selected;
  const selectedActionable = Boolean(selected && ACTIONABLE_STATUSES.has(selected.status));

  return (
    <div className="flex flex-col">
      {transactions.map((transaction) => {
        const direction = transactionDirection(transaction);
        return (
          <div
            key={transaction.id}
            onClick={(event) => {
              if (cameFromControl(event)) return;
              detail.setSelected(transaction);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              if (cameFromControl(event)) return;
              event.preventDefault();
              detail.setSelected(transaction);
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
              <p className="truncate font-medium text-text-primary">{transaction.patientName}</p>
              <p className="truncate font-mono text-xs text-text-secondary">
                {transaction.receiptNumber}
              </p>
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
                {formatCurrency(transaction.amount)}
              </p>
              <p className="text-xs text-text-secondary">
                {new Date(transaction.createdAt).toLocaleString(undefined, {
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
        open={detail.isOpen}
        onClose={detail.close}
        title={selected?.receiptNumber ?? ""}
        subtitle={selected?.patientName}
        data={selected}
        footer={
          selectedActionable && (canVoid || canRequestRefund) ? (
            <div className="flex gap-2">
              {canRequestRefund && (
                <Button
                  variant="secondary"
                  className="flex-1 justify-center"
                  onClick={() => {
                    onRequestRefund?.(selected!);
                    detail.close();
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
                    onVoid?.(selected!);
                    detail.close();
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
