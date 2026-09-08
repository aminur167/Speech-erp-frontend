"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StaffAvatar } from "@/components/staff/StaffAvatar";
import { AttendanceCell } from "@/components/staff/AttendanceCell";
import { humanizeField } from "@/utils/fields";
import { formatCurrency } from "@/utils/currency";
import type { StaffAttendance, StaffMember } from "@/types/domain";

/** Anything the user can already act on (attendance buttons, edit/delete) shouldn't also open the row's details. */
const INTERACTIVE = "a, button, input, select, textarea, label, [role='button']";

function cameFromControl(event: { target: EventTarget | null; currentTarget: EventTarget }): boolean {
  const hit = (event.target as HTMLElement | null)?.closest(INTERACTIVE);
  return Boolean(hit) && hit !== event.currentTarget;
}

export function StaffTable({
  staff,
  todayAttendance,
  onViewDetails,
  onEdit,
  onDelete,
}: {
  staff: StaffMember[];
  todayAttendance: Record<string, StaffAttendance>;
  onViewDetails: (member: StaffMember) => void;
  onEdit: (member: StaffMember) => void;
  onDelete: (member: StaffMember) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="py-2 pr-4 font-medium">Staff</th>
            <th className="py-2 pr-4 font-medium">Designation</th>
            <th className="py-2 pr-4 font-medium">Contact</th>
            <th className="py-2 pr-4 font-medium">Monthly Salary</th>
            <th className="py-2 pr-4 font-medium">Today&apos;s Attendance</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 pr-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((member) => (
            <tr
              key={member.id}
              onClick={(event: MouseEvent<HTMLTableRowElement>) => {
                if (cameFromControl(event)) return;
                onViewDetails(member);
              }}
              onKeyDown={(event: KeyboardEvent<HTMLTableRowElement>) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                if (cameFromControl(event)) return;
                event.preventDefault();
                onViewDetails(member);
              }}
              tabIndex={0}
              title="View staff details"
              className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-primary-light/40 focus:outline-none focus-visible:bg-primary-light/40"
            >
              <td className="py-3 pr-4">
                <div className="flex items-center gap-3">
                  <StaffAvatar name={member.name} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text-primary">{member.name}</p>
                    <p className="font-mono text-xs text-text-secondary">{member.staffCode}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 pr-4">
                <Badge tone="neutral" label={humanizeField(member.designation)} />
              </td>
              <td className="py-3 pr-4">
                <p className="text-text-primary">{member.phone}</p>
                {member.email && <p className="text-xs text-text-secondary">{member.email}</p>}
              </td>
              <td className="py-3 pr-4 font-medium text-text-primary">
                {formatCurrency(member.monthlySalary)}
              </td>
              <td className="py-3 pr-4">
                <AttendanceCell staffId={member.id} record={todayAttendance[member.id]} />
              </td>
              <td className="py-3 pr-4">
                <Badge
                  tone={member.status === "active" ? "success" : "neutral"}
                  label={member.status}
                />
              </td>
              <td className="py-3 pr-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" className="px-2" aria-label="Edit staff" onClick={() => onEdit(member)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="danger"
                    className="px-2"
                    aria-label="Remove staff"
                    onClick={() => onDelete(member)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
