"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { Service, ServiceCategory } from "@/types/domain";
import type { ServiceInput } from "@/lib/api/services";
import type { ApiError } from "@/types/api";

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  daily: "Daily",
  monthly: "Monthly",
  installment: "Installment",
  online: "Online",
};

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
  originalFee: z
    .string()
    .optional()
    .refine((value) => !value || Number(value) > 0, "Enter a price greater than 0."),
  durationLabel: z.string().optional(),
  sessionsLabel: z.string().optional(),
  expiryLabel: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export function ServiceForm({
  initialValues,
  fixedCategory,
  submitLabel,
  onSubmit,
  onCancel,
  isSubmitting,
  apiError,
}: {
  initialValues?: Service;
  /** When set, the category is locked to this value (shown read-only) instead of a picker. */
  fixedCategory?: ServiceCategory;
  submitLabel?: string;
  onSubmit: (input: ServiceInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  /** A failed submit (e.g. a duplicate code, or a permission error) — field errors map onto the matching input, anything else shows as a banner. Never silently swallowed. */
  apiError?: ApiError;
}) {
  const lockedCategory = fixedCategory ?? initialValues?.category;

  const {
    register,
    handleSubmit,
    setError,
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
          originalFee: initialValues.originalFee ? String(initialValues.originalFee) : "",
          durationLabel: initialValues.durationLabel ?? "",
          sessionsLabel: initialValues.sessionsLabel ?? "",
          expiryLabel: initialValues.expiryLabel ?? "",
        }
      : { category: fixedCategory ?? "daily", isOnline: false },
  });

  useEffect(() => {
    if (apiError?.fieldErrors) {
      Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
        setError(field as keyof ServiceFormValues, { message: messages[0] });
      });
    }
  }, [apiError, setError]);

  const submit = (values: ServiceFormValues) => {
    onSubmit({
      name: values.name,
      code: values.code,
      category: lockedCategory ?? values.category,
      fee: Number(values.fee),
      isOnline: Boolean(values.isOnline),
      description: values.description || undefined,
      originalFee: values.originalFee ? Number(values.originalFee) : undefined,
      durationLabel: values.durationLabel || undefined,
      sessionsLabel: values.sessionsLabel || undefined,
      expiryLabel: values.expiryLabel || undefined,
    });
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(submit)}>
      {apiError && !apiError.fieldErrors && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{apiError.message}</p>
      )}
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
      {lockedCategory ? (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-secondary">Category:</span>
          <Badge tone="info" label={CATEGORY_LABELS[lockedCategory]} />
        </div>
      ) : (
        <Select {...register("category")}>
          <option value="daily">Daily</option>
          <option value="monthly">Monthly</option>
          <option value="installment">Installment</option>
          <option value="online">Online</option>
        </Select>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          type="number"
          step="0.01"
          placeholder="Original Price (optional, for discounts)"
          error={errors.originalFee?.message}
          {...register("originalFee")}
        />
        <Input placeholder="Duration (e.g. 1 Month)" {...register("durationLabel")} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input placeholder="Sessions (e.g. 12 Sessions)" {...register("sessionsLabel")} />
      </div>
      <Input
        placeholder="Expiry / Validity (e.g. 3 months from purchase)"
        {...register("expiryLabel")}
      />
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
          {submitLabel ?? (initialValues ? "Save Changes" : "Add Service")}
        </Button>
      </div>
    </form>
  );
}
