"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useUpdatePatient } from "@/hooks/patients/useUpdatePatient";
import type { ApiError } from "@/types/api";
import type { Patient } from "@/types/domain";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

const patientSchema = z.object({
  name: z.string().min(2, "Full name is required."),
  phone: z.string().min(6, "Enter a valid phone number."),
  email: z.union([z.string().email("Enter a valid email address."), z.literal("")]).optional(),
  gender: z.enum(["male", "female"], { message: "Gender is required." }),
  bloodGroup: z.union([z.enum(BLOOD_GROUPS), z.literal("")]).optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required."),
  guardianName: z.string().optional(),
  guardianRelation: z.union([
    z.enum(["father", "mother", "guardian", "other"]),
    z.literal(""),
  ]).optional(),
  // Whether this is actually required depends on the patient's age; the
  // backend enforces that cutoff and returns a field error here when it
  // applies, same as on registration (docs/02).
  guardianPhone: z.string().optional(),
  emergencyContact: z.string().optional(),
  address: z.string().min(1, "Address is required."),
  referredBy: z.string().optional(),
  nationalId: z.string().optional(),
  chiefComplaint: z.string().optional(),
  notes: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

export function PatientEditForm({
  patient,
  onSuccess,
  onCancel,
}: {
  patient: Patient;
  onSuccess: (patient: Patient) => void;
  onCancel: () => void;
}) {
  const updatePatient = useUpdatePatient();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: patient.name,
      phone: patient.phone,
      email: patient.email ?? "",
      // A legacy record could still hold the retired "other" value (e.g. set
      // via the Django admin, which still allows it) -- the dropdown no
      // longer offers it, so fall back to unset rather than lie about the
      // type; the manager must actively pick Male or Female to save.
      gender:
        patient.gender === "male" || patient.gender === "female"
          ? patient.gender
          : (undefined as unknown as PatientFormValues["gender"]),
      bloodGroup: patient.bloodGroup ?? "",
      dateOfBirth: patient.dateOfBirth ?? "",
      guardianName: patient.guardianName ?? "",
      guardianRelation: patient.guardianRelation ?? "",
      guardianPhone: patient.guardianPhone ?? "",
      emergencyContact: patient.emergencyContact ?? "",
      address: patient.address ?? "",
      referredBy: patient.referredBy ?? "",
      nationalId: patient.nationalId ?? "",
      chiefComplaint: patient.chiefComplaint ?? "",
      notes: patient.notes ?? "",
    },
  });

  const onSubmit = (values: PatientFormValues) => {
    updatePatient.mutate(
      {
        id: patient.id,
        input: {
          ...values,
          email: values.email || undefined,
          gender: values.gender || undefined,
          bloodGroup: values.bloodGroup || undefined,
          guardianRelation: values.guardianRelation || undefined,
        },
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          placeholder="Full Name *"
          autoComplete="off"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input placeholder="Phone *" error={errors.phone?.message} {...register("phone")} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          placeholder="Email (optional)"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          type="date"
          aria-label="Date of Birth"
          error={errors.dateOfBirth?.message}
          {...register("dateOfBirth")}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select defaultValue="" error={errors.gender?.message} {...register("gender")}>
          <option value="">Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </Select>
        <Select defaultValue="" error={errors.bloodGroup?.message} {...register("bloodGroup")}>
          <option value="">Blood Group (optional)</option>
          {BLOOD_GROUPS.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          placeholder="Guardian Name (optional)"
          autoComplete="off"
          error={errors.guardianName?.message}
          {...register("guardianName")}
        />
        <Select
          defaultValue=""
          error={errors.guardianRelation?.message}
          {...register("guardianRelation")}
        >
          <option value="">Relation (optional)</option>
          <option value="father">Father</option>
          <option value="mother">Mother</option>
          <option value="guardian">Guardian</option>
          <option value="other">Other</option>
        </Select>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          placeholder="Guardian Phone (required if the patient is a minor)"
          error={errors.guardianPhone?.message}
          {...register("guardianPhone")}
        />
        <Input
          placeholder="Emergency Contact (optional)"
          error={errors.emergencyContact?.message}
          {...register("emergencyContact")}
        />
      </div>
      <Input
        placeholder="Address *"
        error={errors.address?.message}
        {...register("address")}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          placeholder="Referred By (optional)"
          error={errors.referredBy?.message}
          {...register("referredBy")}
        />
        <Input
          placeholder="National ID (optional)"
          error={errors.nationalId?.message}
          {...register("nationalId")}
        />
      </div>
      <Textarea
        rows={2}
        placeholder="Chief Complaint — reason for visit (optional)"
        error={errors.chiefComplaint?.message}
        {...register("chiefComplaint")}
      />
      <Textarea
        rows={2}
        placeholder="Notes (optional)"
        error={errors.notes?.message}
        {...register("notes")}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={updatePatient.isPending}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}
