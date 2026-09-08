"use client";

import { createPortal } from "react-dom";
import { Printer } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/utils/currency";
import type { SalaryPayment, SalaryPaymentStatus } from "@/types/domain";

const STATUS_TONE: Record<SalaryPaymentStatus, "warning" | "info" | "danger" | "success"> = {
  pending_approval: "warning",
  approved: "info",
  rejected: "danger",
  paid: "success",
};

function monthLabel(month: string): string {
  return new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** The invoice itself — rendered twice by SalaryInvoiceModal: once in place for the screen, once portaled to <body> for print. */
function SalaryInvoiceCard({ payment }: { payment: SalaryPayment }) {
  const invoiceNumber = payment.expenseCode || `SP-${payment.id.padStart(6, "0")}`;

  return (
    <div className="receipt-card flex flex-col gap-6 rounded-xl border border-border bg-surface p-6">
      <div className="flex items-start justify-between border-b-2 border-primary/15 pb-4">
        <div>
          <p className="text-lg font-semibold text-primary-dark">Speech Therapy Lab</p>
          <p className="text-xs text-text-secondary">{payment.branchName}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Salary Invoice
          </p>
          <p className="font-mono text-sm text-text-primary">{invoiceNumber}</p>
          <Badge tone={STATUS_TONE[payment.status]} label={payment.status.replace("_", " ")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-text-secondary">Paid To</p>
          <p className="font-medium text-text-primary">{payment.staffName}</p>
          <p className="font-mono text-xs text-text-secondary">{payment.staffCode}</p>
        </div>
        <div>
          <p className="text-xs text-text-secondary">For the Month of</p>
          <p className="font-medium text-text-primary">{monthLabel(payment.month)}</p>
        </div>
      </div>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="py-2 font-medium">Description</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border/60">
            <td className="py-3 text-text-primary">
              Net salary payment — {monthLabel(payment.month)}
            </td>
            <td className="py-3 text-right text-text-primary">{formatCurrency(payment.amount)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td className="pt-3 text-right text-sm font-semibold text-text-primary">Total</td>
            <td className="pt-3 text-right text-lg font-bold text-primary-dark">
              {formatCurrency(payment.amount)}
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
        <div>
          <p className="text-xs text-text-secondary">Requested By</p>
          <p className="font-medium text-text-primary">{payment.requestedBy || "—"}</p>
          <p className="text-xs text-text-secondary">{formatDate(payment.createdAt)}</p>
        </div>
        <div>
          <p className="text-xs text-text-secondary">Approved By</p>
          <p className="font-medium text-text-primary">{payment.reviewedBy || "—"}</p>
          <p className="text-xs text-text-secondary">{formatDate(payment.reviewedAt)}</p>
        </div>
        {payment.status === "paid" && (
          <>
            <div>
              <p className="text-xs text-text-secondary">Payment Method</p>
              <p className="font-medium capitalize text-text-primary">
                {payment.paymentMethod.replace("_", " ")}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Paid On</p>
              <p className="font-medium text-text-primary">{formatDate(payment.paidAt)}</p>
            </div>
          </>
        )}
        {payment.reviewNote && (
          <div className="col-span-2">
            <p className="text-xs text-text-secondary">Note</p>
            <p className="text-text-primary">&quot;{payment.reviewNote}&quot;</p>
          </div>
        )}
      </div>

      <p className="border-t border-dashed border-border pt-4 text-center text-[10px] text-text-secondary">
        This is a computer-generated invoice and does not require a signature.
      </p>
    </div>
  );
}

export function SalaryInvoiceModal({
  payment,
  onClose,
}: {
  payment: SalaryPayment | null;
  onClose: () => void;
}) {
  if (!payment) return null;

  return (
    <Modal open={Boolean(payment)} onClose={onClose} title="Salary Invoice" className="max-w-xl">
      <div className="flex flex-col gap-4">
        <div className="print:hidden">
          <SalaryInvoiceCard payment={payment} />
        </div>

        {typeof document !== "undefined" &&
          createPortal(
            <div id="print-area" className="hidden print:block">
              <SalaryInvoiceCard payment={payment} />
            </div>,
            document.body,
          )}

        <div className="flex justify-end gap-2 print:hidden">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
        </div>
      </div>
    </Modal>
  );
}
