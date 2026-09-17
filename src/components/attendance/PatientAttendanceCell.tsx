"use client";

import { useState } from "react";
import { CalendarOff, Check, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useMarkPatientAttendance } from "@/hooks/attendance/usePatientAttendance";
import { toLocalDateString } from "@/utils/time";
import type {
  AttendanceServiceKind,
  PatientAttendance,
  PatientAttendanceStatus,
} from "@/types/domain";

const tone: Record<PatientAttendanceStatus, "success" | "info" | "danger"> = {
  present: "success",
  informed_absence: "info",
  absent: "danger",
};

const label: Record<PatientAttendanceStatus, string> = {
  present: "Present",
  informed_absence: "Informed absence",
  absent: "Absent",
};

/**
 * The row's status badge.
 *
 * Every row has one, including the ones nobody has touched: absent is the
 * resting state, not a blank waiting to be filled in. A sheet where the
 * manager marked the four people who came in is a *finished* sheet, and it
 * should look like one.
 *
 * A default absent is grey and an explicitly marked one is red, because on a
 * sheet where most rows are absent by definition, painting all of them in the
 * danger colour makes the colour mean nothing. Red here says a manager looked
 * at this person and recorded a no-show.
 */
export function PatientAttendanceStatusBadge({
  status,
  marked,
}: {
  status: PatientAttendanceStatus;
  /** Whether anybody actually acted on this row, as opposed to the default. */
  marked: boolean;
}) {
  return (
    <div className="flex flex-col items-start gap-0.5">
      <Badge
        tone={status === "absent" && !marked ? "neutral" : tone[status]}
        label={label[status]}
      />
      {!marked && (
        <span className="text-[11px] text-text-secondary">not marked yet</span>
      )}
    </div>
  );
}

/**
 * One row's mark, owning its own mutation.
 *
 * The table doesn't thread callbacks for this — the same shape as the staff
 * roster's cell — so a row re-renders on its own answer without the whole
 * sheet re-rendering with it.
 *
 * **Present is a toggle, not a one-way door.** Everyone starts absent, so the
 * button asserts "this person came in" and pressing it again takes that back.
 * The mark is an upsert server-side, so the correction replaces the row
 * instead of appending one that contradicts it — which matters, because the
 * row most likely to need fixing is the one marked present by mistake.
 *
 * "Informed absence" opens a dialog for the return date rather than marking
 * immediately, because that date is the entire difference between a patient
 * who told the clinic and one who quietly stopped coming.
 */
export function PatientAttendanceCell({
  patientId,
  serviceKind,
  date,
  status,
  record,
}: {
  patientId: string;
  serviceKind: AttendanceServiceKind;
  /** The day being marked — the sheet can be back-dated. */
  date: string;
  /** The row's current status; `absent` when nobody has marked it. */
  status: PatientAttendanceStatus;
  record: PatientAttendance | null;
}) {
  const mark = useMarkPatientAttendance();
  const [askingReturn, setAskingReturn] = useState(false);
  const [returnOn, setReturnOn] = useState("");

  const send = (next: PatientAttendanceStatus, expectedReturnOn?: string) =>
    mark.mutate({ patientId, serviceKind, status: next, date, expectedReturnOn });

  const pendingStatus = mark.isPending ? mark.variables?.status : undefined;
  const isPresent = status === "present";
  const isExcused = status === "informed_absence";

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          variant={isPresent ? "primary" : "secondary"}
          className="px-3 py-1.5 text-xs"
          aria-pressed={isPresent}
          title={
            isPresent
              ? "Marked present — press again to put it back to absent"
              : "Mark present"
          }
          onClick={() => send(isPresent ? "absent" : "present")}
          isLoading={pendingStatus === "present" || pendingStatus === "absent"}
        >
          <Check className="h-3.5 w-3.5" />
          Present
        </Button>

        <Button
          variant={isExcused ? "primary" : "ghost"}
          title="Informed absence — they told us they'd be away"
          aria-label="Informed absence"
          aria-pressed={isExcused}
          className="px-2"
          onClick={() => {
            setReturnOn(record?.expectedReturnOn ?? "");
            setAskingReturn(true);
          }}
        >
          <CalendarOff className="h-3.5 w-3.5" />
        </Button>

        {/* Only offered once there is something to undo. A plain absent row is
            already the default, so "clear" on it would do nothing visible. */}
        {record && (
          <Button
            variant="ghost"
            title="Clear this mark — back to plain absent"
            aria-label="Clear this mark"
            className="px-2 text-text-secondary"
            onClick={() => send("absent")}
            isLoading={pendingStatus === "absent"}
          >
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <Modal
        open={askingReturn}
        onClose={() => setAskingReturn(false)}
        title="Informed absence"
        description="They told us they would be away. When are they expected back?"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Expected return date"
            type="date"
            value={returnOn}
            min={date}
            onChange={(event) => setReturnOn(event.target.value)}
          />
          <p className="text-xs text-text-secondary">
            Until this date the patient won&apos;t be flagged as having stopped coming.
            Leave it blank if they didn&apos;t say — a short grace period applies instead.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setAskingReturn(false)}>
              Cancel
            </Button>
            <Button
              isLoading={pendingStatus === "informed_absence"}
              onClick={() => {
                send("informed_absence", returnOn || undefined);
                setAskingReturn(false);
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/** Today, in the local calendar — the sheet's default day. */
export const today = toLocalDateString;
