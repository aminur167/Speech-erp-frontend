"use client";

import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { RowDetailDrawer, useRowDetail } from "@/components/ui/RowDetailDrawer";
import { PatientAttendanceCell } from "@/components/attendance/PatientAttendanceCell";
import type { AttendanceRosterRow } from "@/lib/api/patientAttendance";
import type { AttendanceServiceKind } from "@/types/domain";

/**
 * The day's sheet.
 *
 * "Last seen" carries the weight of the whole screen: it is what tells a
 * manager that someone has quietly stopped coming, which is the thing
 * attendance is being taken to find out.
 */
export function PatientAttendanceTable({
  rows,
  serviceKind,
  date,
  readOnly = false,
}: {
  rows: AttendanceRosterRow[];
  serviceKind: AttendanceServiceKind;
  date: string;
  /** Admin can read a branch's sheet but not mark it. */
  readOnly?: boolean;
}) {
  const detail = useRowDetail<AttendanceRosterRow>();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="py-2 pr-4 font-medium">Patient</th>
            <th className="py-2 pr-4 font-medium">Service</th>
            <th className="py-2 pr-4 font-medium">Last Seen</th>
            {!readOnly && <th className="py-2 pr-4 font-medium">Attendance</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.patientId} {...detail.rowProps(row)}>
              <td className="py-2 pr-4">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-text-primary">{row.patientName}</p>
                  {row.alert && (
                    <span
                      title={`Not seen in ${row.daysSinceLastVisit} days`}
                      className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Stopped coming
                    </span>
                  )}
                </div>
                <p className="font-mono text-xs text-text-secondary">
                  {row.patientCode}
                </p>
              </td>
              <td className="py-2 pr-4">
                {/* Every active service of this kind — one mark covers them all. */}
                {row.serviceNames.map((name) => (
                  <p key={name} className="text-text-primary">
                    {name}
                  </p>
                ))}
              </td>
              <td className="whitespace-nowrap py-2 pr-4">
                {row.lastPresentOn ? (
                  <>
                    <p className="text-text-primary">{row.lastPresentOn}</p>
                    <p className="text-xs text-text-secondary">
                      {row.daysSinceLastVisit === 0
                        ? "today"
                        : `${row.daysSinceLastVisit} days ago`}
                    </p>
                  </>
                ) : (
                  <span className="text-xs text-text-secondary">Never attended</span>
                )}
                {row.excusedUntil && (
                  <Badge
                    tone="info"
                    label={`Away until ${row.excusedUntil}`}
                    className="mt-1"
                  />
                )}
              </td>
              {!readOnly && (
                <td className="py-2 pr-4">
                  <PatientAttendanceCell
                    patientId={row.patientId}
                    serviceKind={serviceKind}
                    date={date}
                    record={row.record}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <RowDetailDrawer
        open={detail.isOpen}
        onClose={detail.close}
        title={detail.selected?.patientName ?? ""}
        subtitle={detail.selected?.patientCode ?? undefined}
        data={detail.selected}
      />
    </div>
  );
}
