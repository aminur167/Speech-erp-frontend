"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
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
  onSubmit: (input: Omit<MaterialInput, "branchId">) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}) {
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
      unit: values.unit,
      quantity: Number(values.quantity),
      unitCost: Number(values.unitCost),
      sellingPrice: Number(values.sellingPrice),
      reorderLevel: Number(values.reorderLevel),
    });
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(submit)}>
      <Input placeholder="Material Name" error={errors.name?.message} {...register("name")} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select {...register("unit")}>
          <option value="piece">Piece</option>
          <option value="box">Box</option>
          <option value="packet">Packet</option>
          <option value="set">Set</option>
          <option value="bottle">Bottle</option>
          <option value="other">Other</option>
        </Select>
        <Input
          type="number"
          placeholder="Quantity"
          error={errors.quantity?.message}
          {...register("quantity")}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          type="number"
          step="0.01"
          placeholder="Unit Cost (BDT)"
          error={errors.unitCost?.message}
          {...register("unitCost")}
        />
        <Input
          type="number"
          step="0.01"
          placeholder="Selling Price (BDT)"
          error={errors.sellingPrice?.message}
          {...register("sellingPrice")}
        />
      </div>
      <Input
        type="number"
        placeholder="Reorder Level"
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
