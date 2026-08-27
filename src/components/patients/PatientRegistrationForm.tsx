"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useCreatePatient } from "@/hooks/patients/useCreatePatient";
import { useAuthStore } from "@/store/authStore";
import type { ApiError } from "@/types/api";
import type { Patient } from "@/types/domain";

const patientSchema = z.object({
  name: z.string().min(2, "Full name is required."),
  phone: z.string().min(6, "Enter a valid phone number."),
  email: z.union([z.string().email("Enter a valid email address."), z.literal("")]).optional(),
  gender: z.union([z.enum(["male", "female", "other"]), z.literal("")]).optional(),
  dateOfBirth: z.string().optional(),
  guardianName: z.string().optional(),
  address: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

export function PatientRegistrationForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: (patient: Patient) => void;
  onCancel: () => void;
}) {
  const user = useAuthStore((state) => state.user);
  const createPatient = useCreatePatient();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PatientFormValues>({ resolver: zodResolver(patientSchema) });

  const onSubmit = (values: PatientFormValues) => {
    createPatient.mutate(
      {
        ...values,
        email: values.email || undefined,
        gender: values.gender || undefined,
        branchId: user?.branchId ?? "branch-1",
      },
      {
        onSuccess,
        onError: (error: ApiError) => {
          if (error.fieldErrors) {
            Object.entries(error.fieldErrors).forEach(([field, messages]) => {
              setError(field as keyof PatientFormValues, { message: messages[0] });
            });
          }
        },
      },
    );
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <Input placeholder="Full Name *" error={errors.name?.message} {...register("name")} />
      <Input placeholder="Phone *" error={errors.phone?.message} {...register("phone")} />
      <Input
        placeholder="Email (optional)"
        error={errors.email?.message}
        {...register("email")}
      />
      <Select defaultValue="" {...register("gender")}>
        <option value="">Gender (optional)</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </Select>
      <Input type="date" aria-label="Date of Birth" {...register("dateOfBirth")} />
      <Input placeholder="Guardian Name (optional)" {...register("guardianName")} />
      <Input placeholder="Address (optional)" {...register("address")} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={createPatient.isPending}>
          Register Patient
        </Button>
      </div>
    </form>
  );
}
