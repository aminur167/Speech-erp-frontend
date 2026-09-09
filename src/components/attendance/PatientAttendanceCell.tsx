"use client";

import { useState } from "react";
import { CalendarOff, Check, UserX } from "lucide-react";
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
 * One row's mark, owning its own mutation.
 *
 * The table doesn't thread callbacks for this — the same shape as the staff
 * roster's cell — so a row re-renders on its own answer without the whole
 * sheet re-rendering with it.
 *
 * "Informed absence" opens a dialog for the return date rather than marking
 * immediately, because that date is the entire difference between a patient
 * who told the clinic and one who quietly stopped coming.
 */
export function PatientAttendanceCell({
  patientId,
  serviceKind,
  date,
  record,
}: {
  patientId: string;
  serviceKind: AttendanceServiceKind;
  /** The day being marked — the sheet can be back-dated. */
  date: string;
  record: PatientAttendance | null;
}) {
  const mark = useMarkPatientAttendance();
  const [askingReturn, setAskingReturn] = useState(false);
  const [returnOn, setReturnOn] = useState("");

  const send = (status: PatientAttendanceStatus, expectedReturnOn?: string) =>
    mark.mutate({ patientId, serviceKind, status, date, expectedReturnOn });

  const pendingStatus = mark.isPending ? mark.variables?.status : undefined;

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {record && (
          <Badge tone={tone[record.status]} label={label[record.status]} />
        )}

        <Button
          variant={record?.status === "present" ? "primary" : "secondary"}
          className="px-3 py-1.5 text-xs"
          onClick={() => send("present")}
          isLoading={pendingStatus === "present"}
        >
          <Check className="h-3.5 w-3.5" />
          Present
        </Button>

        <Button
          variant="ghost"
          title="Informed absence — they told us they'd be away"
          aria-label="Informed absence"
          className="px-2"
          onClick={() => {
            setReturnOn("");
            setAskingReturn(true);
          }}
        >
          <CalendarOff className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="ghost"
          title="Absent"
          aria-label="Absent"
          className="px-2 text-danger hover:bg-danger/10"
          onClick={() => send("absent")}
          isLoading={pendingStatus === "absent"}
        >
          <UserX className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Modal
        open={askingReturn}
        onClose={() => setAskingReturn(false)}
        title="Informed absence"
        description="They told us they would be away. When are they expected back?"
      >
        <div className="flex flex-col gap-4">
          <Input
            type="date"
            aria-label="Expected return date"
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
