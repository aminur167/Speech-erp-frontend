"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import type { Service } from "@/types/domain";
import type { ServiceInput } from "@/lib/api/services";

const serviceSchema = z.object({
  name: z.string().min(2, "Service name is required."),
  code: z.string().min(2, "Service code is required."),
  category: z.enum(["daily", "monthly", "installment", "online"]),
  fee: z
    .string()
    .min(1, "Fee is required.")
    .refine((value) => Number(value) > 0, "Enter a fee greater than 0."),
  isOnline: z.boolean().optional(),
  description: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export function ServiceForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initialValues?: Service;
  onSubmit: (input: ServiceInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: initialValues
      ? {
          name: initialValues.name,
          code: initialValues.code,
          category: initialValues.category,
          fee: String(initialValues.fee),
          isOnline: initialValues.isOnline,
          description: initialValues.description ?? "",
        }
      : { category: "daily", isOnline: false },
  });

  const submit = (values: ServiceFormValues) => {
    onSubmit({
      name: values.name,
      code: values.code,
      category: values.category,
      fee: Number(values.fee),
      isOnline: Boolean(values.isOnline),
      description: values.description || undefined,
    });
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(submit)}>
      <Input placeholder="Service Name" error={errors.name?.message} {...register("name")} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input placeholder="Service Code" error={errors.code?.message} {...register("code")} />
        <Input
          type="number"
          step="0.01"
          placeholder="Fee (BDT)"
          error={errors.fee?.message}
          {...register("fee")}
        />
      </div>
      <Select {...register("category")}>
        <option value="daily">Daily</option>
        <option value="monthly">Monthly</option>
        <option value="installment">Installment</option>
        <option value="online">Online</option>
      </Select>
      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/30"
          {...register("isOnline")}
        />
        This service is delivered online
      </label>
      <Textarea rows={2} placeholder="Description (optional)" {...register("description")} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {initialValues ? "Save Changes" : "Add Service"}
        </Button>
      </div>
    </form>
  );
}
