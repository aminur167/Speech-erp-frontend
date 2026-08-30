"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useCreatePatient } from "@/hooks/patients/useCreatePatient";
import type { ApiError } from "@/types/api";
import type { Patient } from "@/types/domain";

const patientSchema = z.object({
  name: z.string().min(2, "Full name is required."),
  phone: z.string().min(6, "Enter a valid phone number."),
  email: z.union([z.string().email("Enter a valid email address."), z.literal("")]).optional(),
  // Required on create (docs/02) — matching client-side here so the error
  // shows instantly instead of only after a round trip to the server.
  gender: z.enum(["male", "female", "other"], { message: "Gender is required." }),
  dateOfBirth: z.string().min(1, "Date of birth is required."),
  guardianName: z.string().optional(),
  guardianRelation: z.union([
    z.enum(["father", "mother", "guardian", "other"]),
    z.literal(""),
  ]).optional(),
  // Not marked required here: whether it's actually needed depends on the
  // patient's age, and the backend is the one that knows the cutoff and
  // enforces it (docs/02) — a validation error comes back on this field when
  // it applies, surfaced the same way as any other server-side error below.
  guardianPhone: z.string().optional(),
  address: z.string().min(1, "Address is required."),
});

type PatientFormValues = z.infer<typeof patientSchema>;

export function PatientRegistrationForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: (patient: Patient) => void;
  onCancel: () => void;
}) {
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
        guardianRelation: values.guardianRelation || undefined,
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
      <Select defaultValue="" error={errors.gender?.message} {...register("gender")}>
        <option value="">Gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </Select>
      <Input
        type="date"
        aria-label="Date of Birth"
        error={errors.dateOfBirth?.message}
        {...register("dateOfBirth")}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input placeholder="Guardian Name (optional)" {...register("guardianName")} />
        <Select defaultValue="" {...register("guardianRelation")}>
          <option value="">Relation (optional)</option>
          <option value="father">Father</option>
          <option value="mother">Mother</option>
          <option value="guardian">Guardian</option>
          <option value="other">Other</option>
        </Select>
      </div>
      <Input
        placeholder="Guardian Phone (required if the patient is a minor)"
        error={errors.guardianPhone?.message}
        {...register("guardianPhone")}
      />
      <Input
        placeholder="Address *"
        error={errors.address?.message}
        {...register("address")}
      />
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
