"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PaymentMethodSelector } from "@/components/payments/PaymentMethodSelector";
import { Receipt } from "@/components/payments/Receipt";
import { useCollectDuePayment } from "@/hooks/duePayments/useCollectDuePayment";
import {
  useAdvanceOptions,
  useAdvancePreview,
  useCollectMonthlyAdvance,
} from "@/hooks/enrollments/useMonthlyAdvance";
import { AdvanceMonthPicker } from "@/components/enrollments/AdvanceMonthPicker";
import { OutstandingDueNotice } from "@/components/enrollments/OutstandingDueNotice";
import { useCurrentBranchName } from "@/hooks/branches/useCurrentBranchName";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/currency";
import { generateIdempotencyKey } from "@/lib/offline/idempotency";
import type { DuePaymentItem } from "@/lib/api/duePayments";
import type { PaymentMethod, Payment } from "@/types/domain";

export function CollectDuePaymentModal({
  item,
  onClose,
}: {
  item: DuePaymentItem | null;
  onClose: () => void;
}) {
  const user = useAuthStore((state) => state.user);
  const branchName = useCurrentBranchName();
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [amount, setAmount] = useState("");
  // A list, not one: an advance mints one payment per month so each keeps
  // its own receipt, and collapsing them into a single synthetic receipt
  // would throw away the thing that makes an advance auditable.
  const [payments, setPayments] = useState<Payment[]>([]);
  // Closed until the manager reaches for it, so the default behaviour is
  // exactly what it was: collect this month and nothing else.
  const [takingAdvance, setTakingAdvance] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [advanceError, setAdvanceError] = useState<string | null>(null);
  const collectPayment = useCollectDuePayment();
  const collectAdvance = useCollectMonthlyAdvance();

  const isMonthly = item?.type === "monthly";
  const { data: advanceOptions, isLoading: optionsLoading } = useAdvanceOptions(
    isMonthly && takingAdvance ? item?.refId : undefined,
  );
  const { data: advancePreview } = useAdvancePreview(
    isMonthly && takingAdvance ? item?.refId : undefined,
    selectedMonths,
  );

  // Nothing may be paid ahead while anything is owed — including the very row
  // this modal was opened on, which is the usual case here.
  const blockedByArrears = (advanceOptions?.outstandingTotal ?? 0) > 0;
  const isAdvance = takingAdvance && selectedMonths.length > 0 && !blockedByArrears;

  const toggleMonth = (month: string) =>
    setSelectedMonths((current) =>
      current.includes(month)
        ? current.filter((one) => one !== month)
        : [...current, month],
    );

  const amountError = (() => {
    if (amount.trim() === "") return "";
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return "Enter an amount greater than zero.";
    return "";
  })();

  const handleClose = () => {
    setPayments([]);
    setMethod("cash");
    setAmount("");
    setTakingAdvance(false);
    setSelectedMonths([]);
    setAdvanceError(null);
    onClose();
  };

  const handleConfirm = () => {
    if (!user || !item || amountError) return;

    if (isAdvance) {
      setAdvanceError(null);
      collectAdvance.mutate(
        {
          enrollmentId: item.refId,
          months: selectedMonths,
          method,
          idempotencyKey: generateIdempotencyKey(),
        },
        {
          onSuccess: (result) => setPayments(result.payments),
          onError: (failure) => setAdvanceError(failure.message),
        },
      );
      return;
    }

    collectPayment.mutate(
      {
        item,
        method,
        idempotencyKey: generateIdempotencyKey(),
        // Blank means the full scheduled amount, which the server defaults to.
        amount:
          item.type === "installment" && amount.trim() !== "" ? Number(amount) : undefined,
      },
      { onSuccess: (createdPayment) => setPayments([createdPayment]) },
    );
  };

  return (
    <Modal
      open={Boolean(item)}
      onClose={handleClose}
      title={payments.length > 0 ? "Payment Collected" : "Collect Payment"}
      description={
        item && payments.length === 0 ? `${item.patientName} — ${item.label}` : undefined
      }
    >
      {item && payments.length === 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Service</span>
              <span className="font-medium text-text-primary">{item.serviceName}</span>
            </div>
            {item.type === "monthly" && (
              <div className="flex justify-between">
                <span className="text-text-secondary">Billing Month</span>
                <span className="font-medium text-text-primary">{item.label}</span>
              </div>
            )}
            {item.type === "installment" && (
              <>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Installment</span>
                  <span className="font-medium text-text-primary">
                    {item.label} ({item.installmentIndex} of {item.installmentsTotal})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Remaining After This</span>
                  <span className="font-medium text-text-primary">
                    {item.installmentsRemaining}{" "}
                    {item.installmentsRemaining === 1 ? "installment" : "installments"}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-text-secondary">Amount Due</span>
              <span className="text-lg font-semibold text-primary-dark">
                {formatCurrency(item.amount)}
              </span>
            </div>
          </div>

          {/* Installments only: a monthly bill is due in full by the 5th, so
              there's no partial figure to take there. */}
          {item.type === "installment" && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-text-secondary">
                Amount to collect now
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder={String(item.amount)}
              />
              <p className="text-xs text-text-secondary">
                Leave blank to take the full {formatCurrency(item.amount)}. Anything
                less is shared across this patient&apos;s later installments.
              </p>
              {amountError && <p className="text-xs text-danger">{amountError}</p>}
            </div>
          )}

          {/* Monthly only: an installment plan has its own schedule and no
              monthly cycle to pay ahead of. */}
          {item.type === "monthly" && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-medium text-text-secondary">
                  Advance Payment
                </label>
                <Button
                  variant="secondary"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => {
                    setTakingAdvance((current) => !current);
                    setSelectedMonths([]);
                    setAdvanceError(null);
                  }}
                >
                  {takingAdvance ? "This month only" : "Take advance payment"}
                </Button>
              </div>

              {takingAdvance && blockedByArrears && advanceOptions && (
                <OutstandingDueNotice
                  items={advanceOptions.outstandingItems}
                  total={advanceOptions.outstandingTotal}
                />
              )}

              {takingAdvance && (
                <>
                  <p className="text-xs text-text-secondary">
                    Pick the month or months being paid for. Months you leave
                    unticked stay unbilled until they arrive.
                  </p>
                  <AdvanceMonthPicker
                    months={advanceOptions?.months ?? []}
                    selected={selectedMonths}
                    onToggle={toggleMonth}
                    isLoading={optionsLoading}
                    disabled={blockedByArrears}
                  />
                </>
              )}

              {isAdvance && advancePreview && (
                <div className="flex flex-col gap-1 rounded-lg border border-border bg-background p-3 text-sm">
                  {advancePreview.months.map((month) => (
                    <div key={month.month} className="flex justify-between">
                      <span className="text-text-secondary">{month.label}</span>
                      <span className="tabular-nums text-text-primary">
                        {formatCurrency(month.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-border pt-2 font-medium">
                    <span className="text-text-secondary">Total to collect</span>
                    <span className="text-lg tabular-nums text-primary-dark">
                      {formatCurrency(advancePreview.total)}
                    </span>
                  </div>
                </div>
              )}

              {advanceError && <p className="text-xs text-danger">{advanceError}</p>}
            </div>
          )}

          <PaymentMethodSelector value={method} onChange={setMethod} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              isLoading={collectPayment.isPending || collectAdvance.isPending}
              disabled={
                Boolean(amountError) ||
                (takingAdvance && (blockedByArrears || selectedMonths.length === 0))
              }
            >
              {isAdvance && advancePreview
                ? `Collect ${formatCurrency(advancePreview.total)}`
                : "Confirm Payment"}
            </Button>
          </div>
        </div>
      )}

      {item && payments.length > 0 && (
        <div className="flex flex-col gap-4">
          {payments.length > 1 && (
            <p className="text-sm text-text-primary">
              {payments.length} months collected —{" "}
              <span className="font-semibold">
                {formatCurrency(
                  payments.reduce((running, one) => running + one.amount, 0),
                )}
              </span>
              . Each month keeps its own receipt.
            </p>
          )}
          {/* Stacked rather than merged: one receipt per month is what makes
              an advance auditable month by month, and a synthetic combined
              receipt would name a month nobody was actually billed for. */}
          <div className="flex max-h-[26rem] flex-col gap-4 overflow-y-auto">
            {payments.map((one) => (
              <Receipt
                key={one.id}
                payment={one}
                patientName={item.patientName}
                serviceName={item.serviceName}
                branchName={branchName}
              />
            ))}
          </div>
          <Button onClick={handleClose}>Done</Button>
        </div>
      )}
    </Modal>
  );
}
