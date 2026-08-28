"use client";

import Image from "next/image";
import { Printer } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/currency";
import type { Payment } from "@/types/domain";

function MetaField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-wide text-text-secondary">
        {label}
      </dt>
      <dd className={clsx("mt-0.5 text-text-primary", mono ? "font-mono text-xs" : "text-sm")}>
        {value}
      </dd>
    </div>
  );
}

export function Receipt({
  payment,
  patientName,
  serviceName,
  branchName,
}: {
  payment: Payment;
  patientName: string;
  serviceName: string;
  branchName: string;
}) {
  const isRefunded = payment.status === "refunded";
  const isVoid = payment.status === "void";
  // A material sale can carry several comma-joined "Item × qty" segments — render each as its own line.
  const lineItems = serviceName.split(", ").filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      <div id="print-area">
        <Card className="mx-auto w-full max-w-md print:max-w-full print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <div className="flex items-start justify-between gap-4 border-b-2 border-primary/15 pb-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Speech Therapy Lab"
                width={44}
                height={44}
                className="shrink-0 rounded-full"
              />
              <div>
                <p className="text-sm font-bold leading-tight text-primary-dark">
                  Speech Therapy Lab
                </p>
                <p className="text-[10px] leading-tight text-text-secondary">
                  Perfect Therapeutic Medicine
                </p>
                <p className="mt-1 text-xs font-medium text-text-secondary">{branchName}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
                Receipt
              </p>
              <p className="font-mono text-xs font-medium text-text-primary">
                {payment.receiptNumber}
              </p>
            </div>
          </div>

          {(isRefunded || isVoid) && (
            <div
              className={clsx(
                "mt-4 rounded-md border py-1.5 text-center text-xs font-semibold uppercase tracking-wide",
                isRefunded
                  ? "border-status-refunded/30 text-status-refunded"
                  : "border-danger/30 text-danger",
              )}
            >
              {isRefunded ? "Refunded" : "Voided"}
            </div>
          )}

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
            <MetaField label="Date & Time" value={new Date(payment.createdAt).toLocaleString()} />
            <MetaField label="Transaction ID" value={payment.transactionId} mono />
            <MetaField label="Billed To" value={patientName} />
            <MetaField
              label="Payment Method"
              value={payment.method.replace("_", " ")}
            />
            <MetaField label="Collected By" value={payment.collectedBy} />
          </dl>

          <div className="mt-5 border-t border-border pt-3">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
              <span>Description</span>
              {lineItems.length === 1 && <span>Amount</span>}
            </div>
            <div className="mt-2 flex flex-col gap-1.5 border-t border-border pt-2">
              {lineItems.map((item, index) => (
                <div key={index} className="flex items-start justify-between gap-4 text-sm">
                  <span className="text-text-primary">{item}</span>
                  {lineItems.length === 1 && (
                    <span className="shrink-0 font-medium text-text-primary">
                      {formatCurrency(payment.amount)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t-2 border-primary/15 pt-3">
            <span className="text-sm font-semibold text-text-primary">Total Paid</span>
            <span className="text-xl font-bold text-primary-dark">
              {formatCurrency(payment.amount)}
            </span>
          </div>

          <div className="mt-6 flex flex-col items-center gap-1 border-t border-dashed border-border pt-4 text-center">
            <p className="text-xs font-medium text-text-primary">
              Thank you for choosing Speech Therapy Lab
            </p>
            <p className="text-[10px] text-text-secondary">
              This is a computer-generated receipt and does not require a signature.
            </p>
          </div>
        </Card>
      </div>

      <Button
        variant="secondary"
        onClick={() => window.print()}
        className="mx-auto print:hidden"
      >
        <Printer className="h-4 w-4" />
        Print Receipt
      </Button>
    </div>
  );
}
