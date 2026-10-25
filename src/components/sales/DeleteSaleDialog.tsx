"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { useVoidSale } from "@/hooks/sales/useSales";
import { formatCurrency } from "@/utils/currency";
import type { MaterialSale } from "@/types/domain";

/**
 * Removing a sale from Sell History.
 *
 * Says plainly what it does, because "Delete" undersells it: the goods go
 * back on the shelf and the money comes out of the day's revenue. The record
 * itself survives as a voided payment on Transactions — receipt numbers are
 * sequential, and a hole in them would make the books impossible to
 * reconcile.
 *
 * The reason is required by the server for every void, and it is what makes
 * the audit entry worth reading a year later.
 */
export function DeleteSaleDialog({
  sale,
  onClose,
}: {
  sale: MaterialSale | null;
  onClose: () => void;
}) {
  if (!sale) return null;

  // Keyed so each row opens with an empty reason — see EditSaleCustomerModal
  // for why this is a remount rather than an effect that clears the field.
  return <DeleteSaleForm key={sale.id} sale={sale} onClose={onClose} />;
}

function DeleteSaleForm({
  sale,
  onClose,
}: {
  sale: MaterialSale;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const voidSale = useVoidSale();

  const submit = () => {
    voidSale.mutate({ saleId: sale.id, reason: reason.trim() }, { onSuccess: onClose });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Delete this sale?"
      description={`${sale.customerName} — ${formatCurrency(Number(sale.total))}, receipt ${sale.receiptNumber}.`}
    >
      <form
        className="mt-5 flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <ul className="flex list-disc flex-col gap-1 rounded-lg bg-background p-4 pl-8 text-sm text-text-secondary">
          {sale.items.map((line) => (
            <li key={line.material}>
              <span className="text-text-primary">
                {line.name} × {line.quantity}
              </span>{" "}
              goes back into stock
            </li>
          ))}
          <li>The amount comes out of this branch&apos;s revenue.</li>
          <li>The record stays on Transactions, marked void — nothing is erased.</li>
        </ul>

        <Textarea
          label="Why is this being removed?"
          requiredMark
          rows={3}
          value={reason}
          placeholder="e.g. wrong item rung up"
          onChange={(event) => setReason(event.target.value)}
        />

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Keep it
          </Button>
          <Button
            type="submit"
            variant="danger"
            disabled={!reason.trim() || voidSale.isPending}
          >
            {voidSale.isPending ? "Removing…" : "Delete sale"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
