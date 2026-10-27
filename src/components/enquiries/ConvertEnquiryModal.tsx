"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useConvertEnquiry } from "@/hooks/enquiries/useEnquiries";
import { SOURCE_LABELS } from "@/components/enquiries/options";
import type { Enquiry } from "@/types/domain";

/**
 * Registering a caller as a patient.
 *
 * What the phone gave us is prefilled; the rest is a real registration and
 * the server applies exactly the rules the registration form does — the
 * guardian fields for a minor included. A caller is not a shortcut past
 * them, so this form asks for the same things.
 */
export function ConvertEnquiryModal({
  enquiry,
  onClose,
}: {
  enquiry: Enquiry | null;
  onClose: () => void;
}) {
  if (!enquiry) return null;
  return <ConvertForm key={enquiry.id} enquiry={enquiry} onClose={onClose} />;
}

function ConvertForm({ enquiry, onClose }: { enquiry: Enquiry; onClose: () => void }) {
  // The caller gave a name for whoever the therapy is for; when they are the
  // patient themselves that field is blank, so fall back to their own name.
  const [name, setName] = useState(enquiry.patientName || enquiry.callerName);
  const [phone, setPhone] = useState(enquiry.callerPhone);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [guardianName, setGuardianName] = useState(
    enquiry.callerRelation === "self" ? "" : enquiry.callerName,
  );
  const [guardianRelation, setGuardianRelation] = useState(
    enquiry.callerRelation === "self" ? "" : enquiry.callerRelation,
  );
  const [guardianPhone, setGuardianPhone] = useState(
    enquiry.callerRelation === "self" ? "" : enquiry.callerPhone,
  );
  const [chiefComplaint, setChiefComplaint] = useState(enquiry.concern);

  const convert = useConvertEnquiry();

  const canSubmit =
    name.trim() !== "" && phone.trim() !== "" && dateOfBirth !== "" &&
    gender !== "" && address.trim() !== "";

  const submit = () => {
    if (!canSubmit) return;
    convert.mutate(
      {
        enquiryId: enquiry.id,
        patient: {
          name: name.trim(),
          phone: phone.trim(),
          dateOfBirth,
          gender,
          address: address.trim(),
          guardianName: guardianName.trim(),
          guardianRelation,
          guardianPhone: guardianPhone.trim(),
          chiefComplaint: chiefComplaint.trim(),
        },
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Register as patient"
      description={`${enquiry.callerName} — ${SOURCE_LABELS[enquiry.source]}${
        enquiry.sourceDetail ? ` · ${enquiry.sourceDetail}` : ""
      }`}
    >
      <form
        className="mt-5 flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <p className="rounded-lg bg-background p-3 text-xs text-text-secondary">
          The enquiry stays linked to this patient, so the clinic can still see
          which ad brought them in.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Full name"
            requiredMark
            autoComplete="off"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            label="Phone"
            requiredMark
            inputMode="tel"
            autoComplete="off"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          <Input
            label="Date of birth"
            requiredMark
            type="date"
            value={dateOfBirth}
            onChange={(event) => setDateOfBirth(event.target.value)}
          />
          <Select
            label="Gender"
            requiredMark
            placeholder="Select a gender"
            value={gender}
            onChange={(event) => setGender(event.target.value)}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Select>
        </div>

        <Input
          label="Address"
          requiredMark
          autoComplete="off"
          placeholder="House, road, area, city"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Guardian's name"
            autoComplete="off"
            value={guardianName}
            onChange={(event) => setGuardianName(event.target.value)}
          />
          <Select
            label="Guardian's relation"
            placeholder="Select a relation"
            value={guardianRelation}
            onChange={(event) => setGuardianRelation(event.target.value)}
          >
            <option value="father">Father</option>
            <option value="mother">Mother</option>
            <option value="guardian">Guardian</option>
            <option value="other">Other</option>
          </Select>
          <Input
            label="Guardian's phone"
            inputMode="tel"
            autoComplete="off"
            value={guardianPhone}
            onChange={(event) => setGuardianPhone(event.target.value)}
          />
        </div>
        <p className="-mt-2 text-xs text-text-secondary">
          Guardian details are required for a patient under 18 — the server
          refuses the registration without them.
        </p>

        <Textarea
          label="Chief complaint (optional)"
          rows={2}
          value={chiefComplaint}
          onChange={(event) => setChiefComplaint(event.target.value)}
        />

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit || convert.isPending}>
            {convert.isPending ? "Registering…" : "Register patient"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
