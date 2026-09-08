"use client";

import { CalendarOff, Clock, LogIn, LogOut, UserX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useCheckIn, useCheckOut, useMarkAttendanceStatus } from "@/hooks/staff/useAttendanceActions";
import { humanizeField } from "@/utils/fields";
import type { StaffAttendance } from "@/types/domain";

const statusTone: Record<StaffAttendance["status"], "success" | "warning" | "info" | "danger"> = {
  present: "success",
  late: "warning",
  on_leave: "info",
  absent: "danger",
};

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function AttendanceCell({
  staffId,
  record,
}: {
  staffId: string;
  record?: StaffAttendance;
}) {
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const markStatus = useMarkAttendanceStatus();

  if (!record) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <Button variant="secondary" onClick={() => checkIn.mutate(staffId)} isLoading={checkIn.isPending}>
          <LogIn className="h-3.5 w-3.5" />
          Check In
        </Button>
        <Button
          variant="ghost"
          title="Mark on leave"
          aria-label="Mark on leave"
          className="px-2"
          onClick={() => markStatus.mutate({ staffId, status: "on_leave" })}
          isLoading={markStatus.isPending && markStatus.variables?.status === "on_leave"}
        >
          <CalendarOff className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          title="Mark absent"
          aria-label="Mark absent"
          className="px-2 text-danger hover:bg-danger/10"
          onClick={() => markStatus.mutate({ staffId, status: "absent" })}
          isLoading={markStatus.isPending && markStatus.variables?.status === "absent"}
        >
          <UserX className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  if (record.status === "on_leave" || record.status === "absent") {
    return (
      <div className="flex items-center gap-2">
        <Badge tone={statusTone[record.status]} label={humanizeField(record.status)} />
        <Button variant="secondary" onClick={() => checkIn.mutate(staffId)} isLoading={checkIn.isPending}>
          Check In
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex items-center gap-2">
        <Badge tone={statusTone[record.status]} label={humanizeField(record.status)} />
        <span className="flex items-center gap-1 text-xs text-text-secondary">
          <Clock className="h-3 w-3" />
          {formatTime(record.checkInAt)}
          {record.checkOutAt && ` – ${formatTime(record.checkOutAt)}`}
        </span>
      </div>
      {!record.checkOutAt && (
        <Button variant="secondary" onClick={() => checkOut.mutate(staffId)} isLoading={checkOut.isPending}>
          <LogOut className="h-3.5 w-3.5" />
          Check Out
        </Button>
      )}
    </div>
  );
}
