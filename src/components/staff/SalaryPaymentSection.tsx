"use client";

import { useState } from "react";
import { Banknote, Clock, FileText } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { LoadingState } from "@/components/ui/states";
import { useSalaryPayments } from "@/hooks/salaryPayments/useSalaryPayments";
import { useRequestSalaryPayment } from "@/hooks/salaryPayments/useRequestSalaryPayment";
import { useDisburseSalaryPayment } from "@/hooks/salaryPayments/useDisburseSalaryPayment";
import { SalaryInvoiceModal } from "@/components/salaryPayments/SalaryInvoiceModal";
import { PAYMENT_METHOD_OPTIONS } from "@/utils/paymentMethod";
import { formatCurrency } from "@/utils/currency";
import type { ApiError } from "@/types/api";
import type { PaymentMethod, SalaryPayment, SalaryPaymentStatus, StaffMember } from "@/types/domain";

const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

const STATUS_TONE: Record<SalaryPaymentStatus, "warning" | "success" | "danger" | "info"> = {
  pending_approval: "warning",
  approved: "info",
  rejected: "danger",
  paid: "success",
};

const STATUS_LABEL: Record<SalaryPaymentStatus, string> = {
  pending_approval: "Pending Admin Approval",
  approved: "Approved — ready to pay",
  rejected: "Rejected",
  paid: "Paid",
};

function monthLabel(month: string): string {
  return new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });
}

export function SalaryPaymentSection({ staff }: { staff: StaffMember }) {
  const { data, isLoading } = useSalaryPayments({ staffId: staff.id });
  const requestPayment = useRequestSalaryPayment();
  const disbursePayment = useDisburseSalaryPayment();

  const [isChoosingMethod, setIsChoosingMethod] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [error, setError] = useState<string | undefined>();
  const [viewingInvoice, setViewingInvoice] = useState<SalaryPayment | null>(null);

  const records = data?.results ?? [];
  const current = records.find((record) => record.month === currentMonth);
  const history = records.filter((record) => record.id !== current?.id).slice(0, 5);

  const handleRequest = () => {
    setError(undefined);
    requestPayment.mutate(
      { staffId: staff.id, month: currentMonth },
      { onError: (apiError: ApiError) => setError(apiError.message) },
    );
  };

  const handleDisburse = () => {
    if (!current) return;
    setError(undefined);
    disbursePayment.mutate(
      { id: current.id, paymentMethod },
      {
        onSuccess: () => setIsChoosingMethod(false),
        onError: (apiError: ApiError) => setError(apiError.message),
      },
    );
  };

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-text-primary">
        Salary Payment — {monthLabel(currentMonth)}
      </h3>

      {isLoading && <LoadingState label="Loading salary payment status…" />}

      {!isLoading && (
        <div className="rounded-lg border border-border p-3">
          {!current && (
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-text-primary">Not requested yet this month.</p>
                <p className="text-xs text-text-secondary">
                  Sends this month&apos;s net payable to Admin for approval.
                </p>
              </div>
              <Button onClick={handleRequest} isLoading={requestPayment.isPending}>
                <Banknote className="h-3.5 w-3.5" />
                Give Salary
              </Button>
            </div>
          )}

          {current && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-text-primary">
                    {formatCurrency(current.amount)}
                  </p>
                  <Badge tone={STATUS_TONE[current.status]} label={STATUS_LABEL[current.status]} />
                </div>

                <div className="flex shrink-0 gap-2">
                  {(current.status === "approved" || current.status === "paid") && (
                    <Button variant="secondary" onClick={() => setViewingInvoice(current)}>
                      <FileText className="h-3.5 w-3.5" />
                      Invoice
                    </Button>
                  )}
                  {current.status === "approved" && !isChoosingMethod && (
                    <Button onClick={() => setIsChoosingMethod(true)}>
                      <Banknote className="h-3.5 w-3.5" />
                      Give Salary
                    </Button>
                  )}
                  {current.status === "rejected" && (
                    <Button onClick={handleRequest} isLoading={requestPayment.isPending}>
                      Request Again
                    </Button>
                  )}
                </div>
              </div>

              {current.status === "pending_approval" && (
                <p className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <Clock className="h-3 w-3" />
                  Requested by {current.requestedBy || "you"} — waiting on Admin.
                </p>
              )}
              {current.status === "rejected" && current.reviewNote && (
                <p className="text-xs text-danger">&quot;{current.reviewNote}&quot;</p>
              )}
              {current.status === "paid" && (
                <p className="text-xs text-text-secondary">
                  Paid via {current.paymentMethod.replace("_", " ")}
                  {current.paidAt && ` on ${new Date(current.paidAt).toLocaleDateString()}`} — logged as{" "}
                  <span className="font-mono">{current.expenseCode}</span> in Expenses.
                </p>
              )}

              {isChoosingMethod && (
                <div className="flex items-center gap-2 border-t border-border pt-2">
                  <Select
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                    containerClassName="w-auto flex-1"
                  >
                    {PAYMENT_METHOD_OPTIONS.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </Select>
                  <Button onClick={handleDisburse} isLoading={disbursePayment.isPending}>
                    Confirm
                  </Button>
                  <Button variant="secondary" onClick={() => setIsChoosingMethod(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}

          {error && <p className="mt-2 text-xs text-danger">{error}</p>}
        </div>
      )}

      {history.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {history.map((record) => (
            <li
              key={record.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
            >
              <span className="text-text-primary">{monthLabel(record.month)}</span>
              <span className="text-xs text-text-secondary">{formatCurrency(record.amount)}</span>
              <Badge tone={STATUS_TONE[record.status]} label={record.status.replace("_", " ")} />
            </li>
          ))}
        </ul>
      )}

      <SalaryInvoiceModal payment={viewingInvoice} onClose={() => setViewingInvoice(null)} />
    </section>
  );
}
