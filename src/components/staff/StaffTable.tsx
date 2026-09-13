"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import { Eye, Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { StaffAvatar } from "@/components/staff/StaffAvatar";
import { AttendanceCell } from "@/components/staff/AttendanceCell";
import { humanizeField } from "@/utils/fields";
import { formatCurrency } from "@/utils/currency";
import { cameFromControl } from "@/utils/interactiveClick";
import type { StaffAttendance, StaffMember } from "@/types/domain";
import { ActionMenu } from "@/components/ui/ActionMenu";

export function StaffTable({
  branchId,
  staff,
  todayAttendance,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleActive,
  canManage,
}: {
  /** Admin only — a Manager is scoped to their own branch server-side. */
  branchId?: string;
  staff: StaffMember[];
  todayAttendance: Record<string, StaffAttendance>;
  onViewDetails: (member: StaffMember) => void;
  onEdit: (member: StaffMember) => void;
  onDelete: (member: StaffMember) => void;
  onToggleActive?: (member: StaffMember) => void;
  /** Staff writes are a branch-desk action — Admin reads the roster without being offered them. */
  canManage: boolean;
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
            {canManage && <th className="w-12 py-2 pr-2 font-medium"><span className="sr-only">Actions</span></th>}
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
                  <StaffAvatar name={member.name} photoUrl={member.photoUrl} />
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
                <AttendanceCell
                  branchId={branchId}
                  staffId={member.id}
                  record={todayAttendance[member.id]}
                />
              </td>
              <td className="py-3 pr-4">
                <Badge
                  tone={member.status === "active" ? "success" : "neutral"}
                  label={member.status}
                />
              </td>
              {canManage && (
                <td className="py-3 pr-2 text-right">
                  <ActionMenu
                    label={`Actions for ${member.name}`}
                    items={[
                      {
                        key: "details",
                        label: "View details",
                        icon: Eye,
                        onSelect: () => onViewDetails(member),
                      },
                      { key: "edit", label: "Edit", icon: Pencil, onSelect: () => onEdit(member) },
                      {
                        key: "toggle",
                        label: member.status === "active" ? "Mark inactive" : "Mark active",
                        icon: member.status === "active" ? PowerOff : Power,
                        hint:
                          member.status === "active"
                            ? "Leaves payroll; history is kept"
                            : undefined,
                        hidden: !onToggleActive,
                        onSelect: () => onToggleActive?.(member),
                      },
                      {
                        key: "delete",
                        label: "Delete",
                        icon: Trash2,
                        tone: "danger",
                        onSelect: () => onDelete(member),
                      },
                    ]}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
