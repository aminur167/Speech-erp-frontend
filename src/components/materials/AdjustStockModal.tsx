"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Material, MaterialMovementType } from "@/types/domain";

export function AdjustStockModal({
  material,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  material: Material | null;
  onClose: () => void;
  onSubmit: (input: { type: MaterialMovementType; quantity: number; note?: string }) => void;
  isSubmitting?: boolean;
}) {
  const [type, setType] = useState<MaterialMovementType>("in");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  const handleClose = () => {
    setType("in");
    setQuantity("");
    setNote("");
    onClose();
  };

  const handleSubmit = () => {
    if (!quantity) return;
    onSubmit({ type, quantity: Number(quantity), note: note || undefined });
  };

  return (
    <Modal
      open={Boolean(material)}
      onClose={handleClose}
      title="Adjust Stock"
      description={
        material ? `${material.name} — current stock: ${material.quantity} ${material.unit}` : undefined
      }
    >
      {material && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("in")}
              className={clsx(
                "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                type === "in"
                  ? "border-success bg-success/10 text-success"
                  : "border-border text-text-secondary hover:border-primary/40",
              )}
            >
              Stock In (+)
            </button>
            <button
              type="button"
              onClick={() => setType("out")}
              className={clsx(
                "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                type === "out"
                  ? "border-danger bg-danger/10 text-danger"
                  : "border-border text-text-secondary hover:border-primary/40",
              )}
            >
              Stock Out (-)
            </button>
          </div>
          <Input
            type="number"
            placeholder="Quantity"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
          <Input
            placeholder="Note (optional)"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!quantity} isLoading={isSubmitting}>
              Confirm
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
