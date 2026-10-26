"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  RELATION_LABELS,
  SOURCE_LABELS,
  STATUS_LABELS,
} from "@/components/enquiries/options";
import { useCreateEnquiry, useUpdateEnquiry } from "@/hooks/enquiries/useEnquiries";
import type { Enquiry } from "@/types/domain";

/**
 * Recording a call, or correcting one.
 *
 * Only three fields are required — a name, a number, and where they heard
 * about the clinic. The first two are what a call back needs; the third is
 * the reason this record exists at all. Demanding more would just mean the
 * desk inventing it while someone waits on the phone.
 */
export function EnquiryFormModal({
  open,
  enquiry,
  onClose,
}: {
  open: boolean;
  enquiry: Enquiry | null;
  onClose: () => void;
}) {
  if (!open) return null;

  // Keyed on the row so opening a different enquiry remounts the form with
  // that row's values — see EditSaleCustomerModal for why this is a remount
  // rather than an effect resyncing the fields.
  return <EnquiryForm key={enquiry?.id ?? "new"} enquiry={enquiry} onClose={onClose} />;
}

function EnquiryForm({
  enquiry,
  onClose,
}: {
  enquiry: Enquiry | null;
  onClose: () => void;
}) {
  const isEditing = Boolean(enquiry);
  const [callerName, setCallerName] = useState(enquiry?.callerName ?? "");
  const [callerPhone, setCallerPhone] = useState(enquiry?.callerPhone ?? "");
  const [callerRelation, setCallerRelation] = useState(enquiry?.callerRelation ?? "self");
  const [patientName, setPatientName] = useState(enquiry?.patientName ?? "");
  const [patientAge, setPatientAge] = useState(
    enquiry?.patientAge != null ? String(enquiry.patientAge) : "",
  );
  const [concern, setConcern] = useState(enquiry?.concern ?? "");
  const [source, setSource] = useState(enquiry?.source ?? "");
  const [sourceDetail, setSourceDetail] = useState(enquiry?.sourceDetail ?? "");
  const [status, setStatus] = useState(enquiry?.status ?? "new");
  const [followUpOn, setFollowUpOn] = useState(enquiry?.followUpOn ?? "");
  const [notes, setNotes] = useState(enquiry?.notes ?? "");

  const create = useCreateEnquiry();
  const update = useUpdateEnquiry();
  const isPending = create.isPending || update.isPending;

  const ageError =
    patientAge.trim() !== "" && !/^\d{1,3}$/.test(patientAge.trim())
      ? "Enter an age in whole years."
      : "";

  const canSubmit =
    callerName.trim() !== "" && callerPhone.trim() !== "" && source !== "" && !ageError;

  const submit = () => {
    if (!canSubmit) return;
    const input = {
      callerName: callerName.trim(),
      callerPhone: callerPhone.trim(),
      callerRelation: callerRelation as Enquiry["callerRelation"],
      patientName: patientName.trim(),
      patientAge: patientAge.trim() === "" ? null : Number(patientAge),
      concern: concern.trim(),
      source: source as Enquiry["source"],
      sourceDetail: sourceDetail.trim(),
      status: status as Enquiry["status"],
      followUpOn: followUpOn || null,
      notes: notes.trim(),
    };

    if (enquiry) {
      update.mutate({ id: enquiry.id, input }, { onSuccess: onClose });
    } else {
      create.mutate(input, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={isEditing ? "Edit enquiry" : "Add enquiry"}
      description={
        isEditing
          ? enquiry?.enquiryCode
          : "Only the name, number and source are needed — fill in the rest if they said it."
      }
    >
      <form
        className="mt-5 flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Caller's name"
            requiredMark
            autoComplete="off"
            placeholder="e.g. Shirin Akter"
            value={callerName}
            onChange={(event) => setCallerName(event.target.value)}
          />
          <Input
            label="Phone number"
            requiredMark
            inputMode="tel"
            autoComplete="off"
            placeholder="e.g. 01712345678"
            value={callerPhone}
            onChange={(event) => setCallerPhone(event.target.value)}
          />
          <Select
            label="Caller is the patient's…"
            value={callerRelation}
            onChange={(event) => setCallerRelation(event.target.value as Enquiry["callerRelation"])}
          >
            {Object.entries(RELATION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Input
            label="Patient's name (optional)"
            autoComplete="off"
            placeholder="Leave blank if the caller is the patient"
            value={patientName}
            onChange={(event) => setPatientName(event.target.value)}
          />
          <Input
            label="Patient's age (optional)"
            inputMode="numeric"
            placeholder="e.g. 4"
            value={patientAge}
            error={ageError}
            onChange={(event) => setPatientAge(event.target.value)}
          />
          <Input
            label="Call back on (optional)"
            type="date"
            value={followUpOn}
            onChange={(event) => setFollowUpOn(event.target.value)}
          />
        </div>

        <Textarea
          label="Patient's concern (optional)"
          rows={2}
          placeholder="e.g. not speaking clearly"
          value={concern}
          onChange={(event) => setConcern(event.target.value)}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Where did the caller hear about us?"
            requiredMark
            placeholder="Select a source"
            value={source}
            onChange={(event) => setSource(event.target.value as Enquiry["source"])}
          >
            {Object.entries(SOURCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Input
            label="Which one? (optional)"
            autoComplete="off"
            placeholder="e.g. October video ad"
            value={sourceDetail}
            onChange={(event) => setSourceDetail(event.target.value)}
          />
        </div>

        {isEditing && (
          <Select
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value as Enquiry["status"])}
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        )}

        <Textarea
          label="Notes (optional)"
          rows={2}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit || isPending}>
            {isPending ? "Saving…" : isEditing ? "Save changes" : "Record enquiry"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
