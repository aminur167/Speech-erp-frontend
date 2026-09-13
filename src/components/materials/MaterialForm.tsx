"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { MaterialImagePicker } from "@/components/materials/MaterialImagePicker";
import type { Material } from "@/types/domain";
import type { MaterialInput } from "@/lib/api/materials";

const materialSchema = z.object({
  name: z.string().min(2, "Material name is required."),
  unit: z.enum(["piece", "box", "packet", "set", "bottle", "other"]),
  quantity: z
    .string()
    .min(1, "Quantity is required.")
    .refine((value) => Number(value) >= 0, "Enter a valid quantity."),
  unitCost: z
    .string()
    .min(1, "Unit cost is required.")
    .refine((value) => Number(value) >= 0, "Enter a valid cost."),
  sellingPrice: z
    .string()
    .min(1, "Selling price is required.")
    .refine((value) => Number(value) >= 0, "Enter a valid price."),
  reorderLevel: z
    .string()
    .min(1, "Reorder level is required.")
    .refine((value) => Number(value) >= 0, "Enter a valid level."),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

export function MaterialForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initialValues?: Material;
  onSubmit: (input: MaterialInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}) {
  const [imageUrl, setImageUrl] = useState(initialValues?.imageUrl);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: initialValues
      ? {
          name: initialValues.name,
          unit: initialValues.unit,
          quantity: String(initialValues.quantity),
          unitCost: String(initialValues.unitCost),
          sellingPrice: String(initialValues.sellingPrice),
          reorderLevel: String(initialValues.reorderLevel),
        }
      : { unit: "piece", quantity: "0", reorderLevel: "5" },
  });

  const submit = (values: MaterialFormValues) => {
    onSubmit({
      name: values.name,
      imageUrl,
      unit: values.unit,
      quantity: Number(values.quantity),
      unitCost: Number(values.unitCost),
      sellingPrice: Number(values.sellingPrice),
      reorderLevel: Number(values.reorderLevel),
    });
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(submit)}>
      <MaterialImagePicker value={imageUrl} onChange={setImageUrl} />
      <Input
        label="Material Name"
        requiredMark
        placeholder="e.g. Picture flash cards"
        autoComplete="off"
        error={errors.name?.message}
        {...register("name")}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select label="Unit" placeholder="Select a unit" {...register("unit")}>
          <option value="piece">Piece</option>
          <option value="box">Box</option>
          <option value="packet">Packet</option>
          <option value="set">Set</option>
          <option value="bottle">Bottle</option>
          <option value="other">Other</option>
        </Select>
        <Input
          label="Quantity"
          placeholder="e.g. 20"
          type="number"
          error={errors.quantity?.message}
          {...register("quantity")}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Unit Cost (BDT)"
          placeholder="e.g. 350"
          type="number"
          step="0.01"
          error={errors.unitCost?.message}
          {...register("unitCost")}
        />
        <Input
          label="Selling Price (BDT)"
          placeholder="e.g. 500"
          type="number"
          step="0.01"
          error={errors.sellingPrice?.message}
          {...register("sellingPrice")}
        />
      </div>
      <Input
        label="Reorder Level"
        placeholder="Alert when stock falls to this, e.g. 5"
        type="number"
        error={errors.reorderLevel?.message}
        {...register("reorderLevel")}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {initialValues ? "Save Changes" : "Add Material"}
        </Button>
      </div>
    </form>
  );
}
