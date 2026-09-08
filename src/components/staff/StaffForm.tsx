"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { toLocalDateString } from "@/utils/time";
import type { StaffInput } from "@/lib/api/staff";
import type { StaffMember } from "@/types/domain";

const staffSchema = z.object({
  name: z.string().min(2, "Name is required."),
  designation: z.enum(["therapist", "receptionist", "accountant", "support_staff", "cleaner", "other"]),
  phone: z.string().min(6, "Phone number is required."),
  email: z.union([z.string().email("Enter a valid email."), z.literal("")]),
  joinedAt: z.string().min(1, "Join date is required."),
  monthlySalary: z
    .string()
    .min(1, "Monthly salary is required.")
    .refine((value) => Number(value) >= 0, "Enter a valid salary."),
  status: z.enum(["active", "inactive"]),
});

type StaffFormValues = z.infer<typeof staffSchema>;

export function StaffForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initialValues?: StaffMember;
  onSubmit: (input: StaffInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: initialValues
      ? {
          name: initialValues.name,
          designation: initialValues.designation,
          phone: initialValues.phone,
          email: initialValues.email ?? "",
          joinedAt: initialValues.joinedAt,
          monthlySalary: String(initialValues.monthlySalary),
          status: initialValues.status,
        }
      : {
          designation: "therapist",
          joinedAt: toLocalDateString(),
          monthlySalary: "0",
          status: "active",
        },
  });

  const submit = (values: StaffFormValues) => {
    onSubmit({
      name: values.name,
      designation: values.designation,
      phone: values.phone,
      email: values.email || undefined,
      joinedAt: values.joinedAt,
      monthlySalary: Number(values.monthlySalary),
      status: values.status,
    });
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(submit)}>
      <Input placeholder="Full Name" autoComplete="off" error={errors.name?.message} {...register("name")} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select {...register("designation")}>
          <option value="therapist">Therapist</option>
          <option value="receptionist">Receptionist</option>
          <option value="accountant">Accountant</option>
          <option value="support_staff">Support Staff</option>
          <option value="cleaner">Cleaner</option>
          <option value="other">Other</option>
        </Select>
        <Select {...register("status")}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input placeholder="Phone Number" error={errors.phone?.message} {...register("phone")} />
        <Input
          type="email"
          placeholder="Email (optional)"
          error={errors.email?.message}
          {...register("email")}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Join Date</label>
          <Input type="date" error={errors.joinedAt?.message} {...register("joinedAt")} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            Monthly Salary (BDT)
          </label>
          <Input
            type="number"
            step="0.01"
            placeholder="Monthly Salary (BDT)"
            error={errors.monthlySalary?.message}
            {...register("monthlySalary")}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {initialValues ? "Save Changes" : "Add Staff"}
        </Button>
      </div>
    </form>
  );
}
