"use client";

import { Printer } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/currency";
import type { Payment } from "@/types/domain";

function Row({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-text-secondary">{label}</dt>
      <dd
        className={clsx(
          "text-right capitalize text-text-primary",
          mono && "font-mono text-xs",
          highlight && "text-base font-semibold text-primary-dark",
        )}
      >
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
  return (
    <Card className="max-w-md">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Payment Receipt</h2>
          <p className="text-xs text-text-secondary">{branchName}</p>
        </div>
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </div>
      <dl className="mt-4 flex flex-col gap-2 text-sm">
        <Row label="Receipt Number" value={payment.receiptNumber} mono />
        <Row label="Transaction ID" value={payment.transactionId} mono />
        <Row label="Patient" value={patientName} />
        <Row label="Service" value={serviceName} />
        <Row label="Payment Method" value={payment.method.replace("_", " ")} />
        <Row label="Collected By" value={payment.collectedBy} />
        <Row label="Timestamp" value={new Date(payment.createdAt).toLocaleString()} />
        <Row label="Amount" value={formatCurrency(payment.amount)} highlight />
      </dl>
    </Card>
  );
}
