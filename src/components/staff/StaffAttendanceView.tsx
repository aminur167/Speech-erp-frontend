"use client";

import { useState } from "react";
import { CalendarOff, Download, LogIn, LogOut, UserX } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar } from "@/components/ui/FilterBar";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { StaffAvatar } from "@/components/staff/StaffAvatar";
import { StaffTabs } from "@/components/staff/StaffTabs";
import { ATTENDANCE_STATUS_TONE } from "@/components/staff/attendanceStatusTone";
import { useStaff } from "@/hooks/staff/useStaff";
import { useTodayAttendance } from "@/hooks/staff/useTodayAttendance";
import {
  useCheckIn,
  useCheckOut,
  useMarkAttendanceStatus,
} from "@/hooks/staff/useAttendanceActions";
import { useIsBeforeOfficeHours } from "@/hooks/staff/useIsBeforeOfficeHours";
import { exportTableToPdf } from "@/utils/exportPdf";
import { humanizeField } from "@/utils/fields";
import type { StaffAttendance, StaffMember } from "@/types/domain";

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "09:02 AM", or "09:00 AM – 04:05 PM" once they have left. */
function timeRange(record: StaffAttendance): string {
  if (!record.checkInAt) return "—";
  return record.checkOutAt
    ? `${formatTime(record.checkInAt)} – ${formatTime(record.checkOutAt)}`
    : `In ${formatTime(record.checkInAt)}`;
}

/**
 * One day's attendance sheet.
 *
 * The columns are a fixed grid rather than a flex row: every cell is
 * optional on some row — nobody has a time before they check in, nobody has
 * a button after they check out — and laying them out by flow put the badge,
 * the clock and the action at a different horizontal position on every line.
 *
 * **Today and a past date are different screens wearing the same layout.**
 * Today is live: the whole roster appears, a missing record means "not
 * checked in yet", and the buttons work. A past date is a record: only the
 * people who actually have a row that day appear at all — including staff
 * who have since left, because they worked that day — and nothing is
 * actionable, because the server refuses a check-in once the office has
 * closed and will not auto-close a day that is already over.
 */
export function StaffAttendanceView({
  branchId,
  basePath,
}: {
  /** Admin only — a Manager is scoped to their own branch server-side. */
  branchId?: string;
  /** Where the tab strip links: `/manager/staff` or `/admin/branches/{id}/staff`. */
  basePath: string;
}) {
  const [date, setDate] = useState(todayIso());
  const isToday = date === todayIso();

  const { data: staff, isLoading: staffLoading } = useStaff(branchId);
  const { data: attendance, isLoading: attendanceLoading } = useTodayAttendance(
    branchId,
    isToday ? undefined : date,
  );

  const checkIn = useCheckIn(branchId);
  const checkOut = useCheckOut(branchId);
  const markStatus = useMarkAttendanceStatus(branchId);
  const isBeforeOfficeHours = useIsBeforeOfficeHours();

  const records = attendance ?? {};
  const roster = staff ?? [];
  const byId = new Map(roster.map((member) => [member.id, member]));

  // Today: everyone on the roster, so the unmarked can be marked. A past
  // day: only the rows that exist — a staff member with no record that day
  // was not absent, there is simply nothing recorded, and the people who
  // have since left the roster are not in `staff` at all.
  const rows: { id: string; member?: StaffMember; record?: StaffAttendance }[] = isToday
    ? roster.map((member) => ({
        id: member.id,
        member,
        record: records[member.id],
      }))
    : Object.entries(records)
        .map(([staffId, record]) => ({
          id: staffId,
          member: byId.get(staffId),
          record,
        }))
        .sort((a, b) =>
          (a.member?.name ?? a.record?.staffName ?? "").localeCompare(
            b.member?.name ?? b.record?.staffName ?? "",
          ),
        );

  const counts = {
    checkedIn: rows.filter(
      (row) =>
        row.record?.status === "present" || row.record?.status === "early_leave",
    ).length,
    notYet: rows.filter((row) => !row.record).length,
    onLeave: rows.filter((row) => row.record?.status === "on_leave").length,
    absent: rows.filter((row) => row.record?.status === "absent").length,
  };

  const nameOf = (row: (typeof rows)[number]) =>
    row.member?.name ?? row.record?.staffName ?? "Unknown";
  const designationOf = (row: (typeof rows)[number]) =>
    row.member ? humanizeField(row.member.designation) : "No longer on the roster";

  const handleExport = () => {
    exportTableToPdf({
      filename: `staff-attendance-${date}.pdf`,
      title: "Staff Attendance",
      subtitle: new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      columns: ["Staff", "Designation", "Status", "Check In", "Check Out"],
      rows: rows.map((row) => [
        nameOf(row),
        designationOf(row),
        row.record ? humanizeField(row.record.status) : "Not checked in",
        formatTime(row.record?.checkInAt ?? null),
        formatTime(row.record?.checkOutAt ?? null),
      ]),
    });
  };

  const isLoading = staffLoading || attendanceLoading;
  // Five columns, fixed: see the component docstring.
  const GRID = "grid grid-cols-[36px_1fr_120px_160px_110px] items-center gap-3";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Staff" />
      <StaffTabs base={basePath} />

      <FilterBar
        dateSlot={
          <Input
            label="Date"
            type="date"
            max={todayIso()}
            value={date}
            onChange={(event) => setDate(event.target.value || todayIso())}
            containerClassName="w-auto"
          />
        }
        actions={
          <Button
            variant="secondary"
            onClick={handleExport}
            disabled={rows.length === 0}
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Checked in" value={String(counts.checkedIn)} tone="success" />
        {/* Deliberately separate from Absent, and neutral: before 4pm this is
            the normal state of somebody who has not arrived yet, not a
            judgement about them. The two used to share one red badge. */}
        <StatCard
          label={isToday ? "Not checked in yet" : "No record"}
          value={String(counts.notYet)}
        />
        <StatCard label="On leave" value={String(counts.onLeave)} tone="primary" />
        <StatCard
          label="Absent"
          value={String(counts.absent)}
          tone={counts.absent > 0 ? "warning" : "primary"}
        />
      </div>

      <Card>
        {isLoading && <LoadingState label="Loading attendance…" />}
        {!isLoading && rows.length === 0 && (
          <EmptyState
            label={
              isToday
                ? "No staff added yet."
                : "Nothing was recorded on this day."
            }
          />
        )}

        {!isLoading && rows.length > 0 && (
          <div className="flex flex-col">
            <div
              className={clsx(
                GRID,
                "border-b border-border px-1 pb-2 text-xs font-medium text-text-secondary",
              )}
            >
              <span />
              <span>Staff</span>
              <span>Status</span>
              <span>Time</span>
              <span />
            </div>

            {rows.map((row) => {
              const record = row.record;
              const departed = !row.member;
              return (
                <div
                  key={row.id}
                  className={clsx(GRID, "border-b border-border px-1 py-2.5 last:border-b-0")}
                >
                  <StaffAvatar name={nameOf(row)} photoUrl={row.member?.photoUrl} size="sm" />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {nameOf(row)}
                    </p>
                    <p className="truncate text-xs text-text-secondary">
                      {designationOf(row)}
                    </p>
                  </div>

                  <div>
                    {record ? (
                      <Badge
                        tone={ATTENDANCE_STATUS_TONE[record.status]}
                        label={humanizeField(record.status)}
                      />
                    ) : (
                      <Badge tone="info" label={isToday ? "Not checked in" : "No record"} />
                    )}
                  </div>

                  <span className="text-xs tabular-nums text-text-secondary">
                    {record ? timeRange(record) : "—"}
                  </span>

                  {/* Actions only on the live sheet: the server refuses a
                      check-in once the office has closed, so offering the
                      button on a past day would be offering a refusal. */}
                  <div className="flex items-center gap-1">
                    {isToday && !record && !departed && (
                      <>
                        <Button
                          variant="secondary"
                          className="px-2 py-1 text-xs"
                          title={
                            isBeforeOfficeHours ? "Check-in opens at 9:00 AM" : undefined
                          }
                          disabled={isBeforeOfficeHours}
                          onClick={() => checkIn.mutate(row.id)}
                          isLoading={checkIn.isPending && checkIn.variables === row.id}
                        >
                          <LogIn className="h-3.5 w-3.5" />
                          Check in
                        </Button>
                        <Button
                          variant="ghost"
                          className="px-1.5"
                          title="Mark on leave"
                          aria-label={`Mark ${nameOf(row)} on leave`}
                          onClick={() =>
                            markStatus.mutate({ staffId: row.id, status: "on_leave" })
                          }
                        >
                          <CalendarOff className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="px-1.5 text-danger hover:bg-danger/10"
                          title="Mark absent"
                          aria-label={`Mark ${nameOf(row)} absent`}
                          onClick={() =>
                            markStatus.mutate({ staffId: row.id, status: "absent" })
                          }
                        >
                          <UserX className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}

                    {isToday && record?.checkInAt && !record.checkOutAt && (
                      <Button
                        variant="secondary"
                        className="px-2 py-1 text-xs"
                        onClick={() => checkOut.mutate(row.id)}
                        isLoading={checkOut.isPending && checkOut.variables === row.id}
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Check out
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
