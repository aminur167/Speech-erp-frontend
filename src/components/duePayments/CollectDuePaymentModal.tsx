"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PaymentMethodSelector } from "@/components/payments/PaymentMethodSelector";
import { Receipt } from "@/components/payments/Receipt";
import { useCollectDuePayment } from "@/hooks/duePayments/useCollectDuePayment";
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
  const [payment, setPayment] = useState<Payment | null>(null);
  const collectPayment = useCollectDuePayment();

  const handleClose = () => {
    setPayment(null);
    setMethod("cash");
    onClose();
  };

  const handleConfirm = () => {
    if (!user || !item) return;
    collectPayment.mutate(
      { item, method, idempotencyKey: generateIdempotencyKey() },
      { onSuccess: (createdPayment) => setPayment(createdPayment) },
    );
  };

  return (
    <Modal
      open={Boolean(item)}
      onClose={handleClose}
      title={payment ? "Payment Collected" : "Collect Payment"}
      description={item && !payment ? `${item.patientName} — ${item.label}` : undefined}
    >
      {item && !payment && (
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
          <PaymentMethodSelector value={method} onChange={setMethod} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} isLoading={collectPayment.isPending}>
              Confirm Payment
            </Button>
          </div>
        </div>
      )}

      {item && payment && (
        <div className="flex flex-col gap-4">
          <Receipt
            payment={payment}
            patientName={item.patientName}
            serviceName={item.serviceName}
            branchName={branchName}
          />
          <Button onClick={handleClose}>Done</Button>
        </div>
      )}
    </Modal>
  );
}
