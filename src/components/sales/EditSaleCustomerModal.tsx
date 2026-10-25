"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useUpdateSaleCustomer } from "@/hooks/sales/useSales";
import type { MaterialSale } from "@/types/domain";

/**
 * Correcting who a counter sale was billed to.
 *
 * Name and phone only. Nothing here touches the money, the products or the
 * stock — a sale's financial record is never edited (docs/04), so a mistyped
 * name is fixed without going anywhere near one.
 */
export function EditSaleCustomerModal({
  sale,
  onClose,
}: {
  sale: MaterialSale | null;
  onClose: () => void;
}) {
  if (!sale) return null;

  // Keyed by the sale, so opening a different row remounts the form with that
  // row's details as its initial state. The alternative — one long-lived form
  // resynced by an effect — is a setState during render's commit, which is
  // both a cascading render and what `react-hooks/set-state-in-effect` exists
  // to catch.
  return <EditCustomerForm key={sale.id} sale={sale} onClose={onClose} />;
}

function EditCustomerForm({
  sale,
  onClose,
}: {
  sale: MaterialSale;
  onClose: () => void;
}) {
  const [name, setName] = useState(sale.customerName);
  const [phone, setPhone] = useState(sale.customerPhone);
  const update = useUpdateSaleCustomer();

  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();
  const unchanged =
    trimmedName === sale.customerName && trimmedPhone === sale.customerPhone;

  const submit = () => {
    update.mutate(
      { saleId: sale.id, name: trimmedName, phone: trimmedPhone },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit customer"
      description={`Receipt ${sale.receiptNumber}. The products, the total and the stock stay as they are.`}
    >
      <form
        className="mt-5 flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Input
          label="Customer Name"
          requiredMark
          value={name}
          autoComplete="off"
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          label="Phone Number"
          requiredMark
          value={phone}
          inputMode="tel"
          autoComplete="off"
          placeholder="e.g. 01712345678"
          onChange={(event) => setPhone(event.target.value)}
        />

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!trimmedName || !trimmedPhone || unchanged || update.isPending}
          >
            {update.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
