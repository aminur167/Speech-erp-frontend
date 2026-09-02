"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { DraftRestoreBanner } from "@/components/ui/DraftRestoreBanner";
import { useCreatePatient } from "@/hooks/patients/useCreatePatient";
import { useDraftAutosave } from "@/hooks/offline/useDraftAutosave";
import { generateIdempotencyKey } from "@/lib/offline/idempotency";
import type { ApiError } from "@/types/api";
import type { Patient } from "@/types/domain";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

const patientSchema = z.object({
  name: z.string().min(2, "Full name is required."),
  phone: z.string().min(6, "Enter a valid phone number."),
  email: z.union([z.string().email("Enter a valid email address."), z.literal("")]).optional(),
  // Required on create (docs/02) — matching client-side here so the error
  // shows instantly instead of only after a round trip to the server.
  gender: z.enum(["male", "female"], { message: "Gender is required." }),
  bloodGroup: z.union([z.enum(BLOOD_GROUPS), z.literal("")]).optional(),
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
  emergencyContact: z.string().optional(),
  address: z.string().min(1, "Address is required."),
  referredBy: z.string().optional(),
  nationalId: z.string().optional(),
  chiefComplaint: z.string().optional(),
  notes: z.string().optional(),
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
    watch,
    reset,
    formState: { errors },
  } = useForm<PatientFormValues>({ resolver: zodResolver(patientSchema) });

  const { hasDraft, draftSavedAt, restoreDraft, discardDraft, clearDraft } = useDraftAutosave(
    "patient-registration",
    watch,
    reset,
  );

  const onSubmit = (values: PatientFormValues) => {
    createPatient.mutate(
      {
        ...values,
        email: values.email || undefined,
        gender: values.gender || undefined,
        bloodGroup: values.bloodGroup || undefined,
        guardianRelation: values.guardianRelation || undefined,
        idempotencyKey: generateIdempotencyKey(),
      },
      {
        onSuccess: (patient) => {
          clearDraft();
          onSuccess(patient);
        },
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
      {hasDraft && draftSavedAt && (
        <DraftRestoreBanner
          savedAt={draftSavedAt}
          onRestore={restoreDraft}
          onDiscard={discardDraft}
        />
      )}
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
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            clearDraft();
            onCancel();
          }}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={createPatient.isPending}>
          Register Patient
        </Button>
      </div>
    </form>
  );
}
