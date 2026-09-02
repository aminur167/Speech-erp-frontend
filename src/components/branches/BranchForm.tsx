"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import type { Branch } from "@/types/domain";
import type { BranchInput } from "@/lib/api/branches";

function todayDateString(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildBranchSchema(isEditing: boolean) {
  return z.object({
    name: z.string().min(2, "Branch name is required."),
    code: z.string().min(2, "Branch code is required."),
    status: z.enum(["active", "inactive"]),
    managerName: z.string().min(2, "Manager name is required."),
    managerCode: z.string().min(2, "Manager code is required."),
    managerEmail: z.string().email("Enter a valid email address."),
    managerPassword: isEditing
      ? z.string().optional()
      : z.string().min(8, "Password must be at least 8 characters."),
    phone: z.string().min(5, "Phone number is required."),
    address: z.string().min(5, "Address is required."),
    therapistCount: z
      .string()
      .min(1, "Required.")
      .refine((value) => Number(value) >= 0, "Enter a valid number."),
    supportCount: z
      .string()
      .min(1, "Required.")
      .refine((value) => Number(value) >= 0, "Enter a valid number."),
    openedAt: z.string().min(1, "Opening date is required."),
  });
}

type BranchFormValues = z.infer<ReturnType<typeof buildBranchSchema>>;

export function BranchForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initialValues?: Branch;
  onSubmit: (input: BranchInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}) {
  const isEditing = Boolean(initialValues);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BranchFormValues>({
    resolver: zodResolver(buildBranchSchema(isEditing)),
    defaultValues: initialValues
      ? {
          name: initialValues.name,
          code: initialValues.code,
          status: initialValues.status,
          managerName: initialValues.managerName,
          managerCode: initialValues.managerCode,
          managerEmail: initialValues.managerEmail,
          managerPassword: "",
          phone: initialValues.phone,
          address: initialValues.address,
          therapistCount: String(initialValues.therapistCount),
          supportCount: String(initialValues.supportCount),
          openedAt: initialValues.openedAt,
        }
      : {
          status: "active",
          therapistCount: "0",
          supportCount: "0",
          openedAt: todayDateString(),
        },
  });

  const submit = (values: BranchFormValues) => {
    onSubmit({
      name: values.name,
      code: values.code,
      status: values.status,
      managerName: values.managerName,
      managerCode: values.managerCode,
      managerEmail: values.managerEmail,
      managerPassword: values.managerPassword || undefined,
      phone: values.phone,
      address: values.address,
      therapistCount: Number(values.therapistCount),
      supportCount: Number(values.supportCount),
      openedAt: values.openedAt,
    });
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(submit)}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          placeholder="Branch Name"
          autoComplete="off"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          placeholder="Branch Code (e.g. BR-DHK-002)"
          error={errors.code?.message}
          {...register("code")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select {...register("status")}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
        <Input type="date" error={errors.openedAt?.message} {...register("openedAt")} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          placeholder="Branch Manager Name"
          error={errors.managerName?.message}
          {...register("managerName")}
        />
        <Input
          placeholder="Manager Code (e.g. MGR-DHK-002)"
          error={errors.managerCode?.message}
          {...register("managerCode")}
        />
      </div>

      <Input placeholder="Phone Number" error={errors.phone?.message} {...register("phone")} />
      <Textarea
        placeholder="Address"
        rows={2}
        error={errors.address?.message}
        {...register("address")}
      />

      <div className="flex flex-col gap-1 border-t border-border pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
          Manager Login
        </p>
        <p className="text-xs text-text-secondary">
          {isEditing
            ? "Leave the password blank to keep the current one."
            : "This is how the branch manager will sign in."}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          type="email"
          placeholder="Manager Email"
          error={errors.managerEmail?.message}
          {...register("managerEmail")}
        />
        <Input
          placeholder={isEditing ? "New Password (optional)" : "Password"}
          error={errors.managerPassword?.message}
          {...register("managerPassword")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          type="number"
          placeholder="Therapists"
          error={errors.therapistCount?.message}
          {...register("therapistCount")}
        />
        <Input
          type="number"
          placeholder="Support Staff"
          error={errors.supportCount?.message}
          {...register("supportCount")}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {initialValues ? "Save Changes" : "Create Branch"}
        </Button>
      </div>
    </form>
  );
}
