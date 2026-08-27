"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PaymentMethodSelector } from "@/components/payments/PaymentMethodSelector";
import { Receipt } from "@/components/payments/Receipt";
import { useCollectDuePayment } from "@/hooks/duePayments/useCollectDuePayment";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/currency";
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
      {
        item,
        payment: {
          patientId: item.patientId,
          amount: item.amount,
          method,
          category: item.type,
          collectedBy: user.name,
          branchId: user.branchId ?? "branch-1",
        },
      },
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
          <div className="flex justify-between rounded-lg border border-border bg-background p-4 text-sm">
            <span className="text-text-secondary">Amount Due</span>
            <span className="text-lg font-semibold text-primary-dark">
              {formatCurrency(item.amount)}
            </span>
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
            branchName="Main Branch"
          />
          <Button onClick={handleClose}>Done</Button>
        </div>
      )}
    </Modal>
  );
}
