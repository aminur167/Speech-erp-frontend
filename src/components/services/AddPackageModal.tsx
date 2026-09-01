"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ServiceCategoryPicker } from "@/components/services/ServiceCategoryPicker";
import { ServiceForm } from "@/components/services/ServiceForm";
import type { ServiceCategory } from "@/types/domain";
import type { ServiceInput } from "@/lib/api/services";
import type { ApiError } from "@/types/api";

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  daily: "Daily Services",
  monthly: "Monthly Services",
  installment: "Installment Services",
  online: "Online Services",
};

export function AddPackageModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  apiError,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: ServiceInput) => void;
  isSubmitting?: boolean;
  apiError?: ApiError;
}) {
  const [category, setCategory] = useState<ServiceCategory | null>(null);

  const handleClose = () => {
    setCategory(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={category ? `Add Package — ${CATEGORY_LABELS[category]}` : "Add Package"}
      description={
        category
          ? "Fill in the package details below."
          : "Choose which service this package belongs to."
      }
    >
      {!category && <ServiceCategoryPicker onSelect={setCategory} />}
      {category && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className="self-start text-xs font-medium text-primary hover:underline"
          >
            ← Change service
          </button>
          <ServiceForm
            fixedCategory={category}
            submitLabel="Add Package"
            onSubmit={onSubmit}
            onCancel={handleClose}
            isSubmitting={isSubmitting}
            apiError={apiError}
          />
        </div>
      )}
    </Modal>
  );
}
