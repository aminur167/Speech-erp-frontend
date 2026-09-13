"use client";

import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/states";
import { StaffAvatar } from "@/components/staff/StaffAvatar";
import { AttendanceCalendar } from "@/components/staff/AttendanceCalendar";
import { useMonthlyStaffReport } from "@/hooks/staff/useMonthlyStaffReport";
import { useStaffMember } from "@/hooks/staff/useStaffMember";
import { formatCurrency } from "@/utils/currency";
import { humanizeField } from "@/utils/fields";
import type { SalaryPayment, SalaryPaymentStatus } from "@/types/domain";

function monthLabel(month: string): string {
  return new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const STATUS_TONE: Record<SalaryPaymentStatus, "warning" | "info" | "danger" | "success"> = {
  pending_approval: "warning",
  approved: "info",
  rejected: "danger",
  paid: "success",
};

const STATS: { key: "presentCount" | "earlyLeaveCount" | "leaveCount" | "absentCount"; label: string; tone: string }[] = [
  { key: "presentCount", label: "Present", tone: "text-success" },
  { key: "earlyLeaveCount", label: "Early Leave", tone: "text-warning" },
  { key: "leaveCount", label: "On Leave", tone: "text-info" },
  { key: "absentCount", label: "Absent", tone: "text-danger" },
];

/**
 * What Admin sees before deciding on a salary request — the staff member's
 * profile, the request itself, and that month's attendance, laid out like the
 * branch roster's staff drawer so the approval isn't a blind rubber stamp.
 *
 * Read-only: roster edits and bonuses are branch-manager actions server-side.
 */
export function StaffPerformanceDrawer({
  payment,
  onClose,
}: {
  payment: SalaryPayment | null;
  onClose: () => void;
}) {
  const { data: member } = useStaffMember(payment?.staffId);
  const { data: rows, isLoading } = useMonthlyStaffReport(payment?.branchId, payment?.month);
  const row = rows?.find((r) => r.staffId === payment?.staffId);

  if (!payment) return null;

  const details: { label: string; value: string }[] = [
    { label: "Designation", value: member ? humanizeField(member.designation) : "—" },
    { label: "Joined", value: member ? formatDate(member.joinedAt) : "—" },
    { label: "Phone", value: member?.phone || "—" },
    { label: "Email", value: member?.email || "—" },
    { label: "Branch", value: payment.branchName },
    { label: "Monthly Salary", value: member ? formatCurrency(member.monthlySalary) : "—" },
  ];

  return (
    <Drawer open={Boolean(payment)} onClose={onClose} title="Staff Details">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <StaffAvatar
            name={payment.staffName}
            photoUrl={member?.photoUrl || payment.staffPhotoUrl || undefined}
            size="lg"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">{payment.staffName}</p>
            <p className="font-mono text-xs text-text-secondary">{payment.staffCode}</p>
          </div>
          {member && (
            <Badge
              tone={member.status === "active" ? "success" : "neutral"}
              label={member.status}
              className="ml-auto"
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5 rounded-lg border border-border p-2.5 text-sm">
          {details.map(({ label, value }) => (
            <div key={label} className="min-w-0">
              <p className="text-[11px] text-text-secondary">{label}</p>
              <p className="truncate font-medium text-text-primary">{value}</p>
            </div>
          ))}
        </div>

        <section className="flex flex-col gap-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Salary Request — {monthLabel(payment.month)}
          </h3>
          <div className="flex flex-col gap-1.5 rounded-lg border border-border p-2.5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-semibold text-text-primary">{formatCurrency(payment.amount)}</p>
              <Badge tone={STATUS_TONE[payment.status]} label={payment.status.replace("_", " ")} />
            </div>
            <p className="text-[11px] text-text-secondary">
              Requested by {payment.requestedBy || "—"} on {new Date(payment.createdAt).toLocaleString()}
            </p>
            {payment.status !== "pending_approval" && payment.reviewedBy && (
              <p className="text-[11px] text-text-secondary">
                {payment.status === "rejected" ? "Rejected" : "Approved"} by {payment.reviewedBy}
                {payment.reviewNote ? ` — "${payment.reviewNote}"` : ""}
              </p>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Attendance — {monthLabel(payment.month)}
          </h3>
          {isLoading && <LoadingState label="Loading performance…" />}
          {!isLoading && row && (
            <div className="grid grid-cols-4 gap-1.5">
              {STATS.map(({ key, label, tone }) => (
                <div key={key} className="rounded-lg border border-border p-2 text-center">
                  <p className={`text-lg font-bold ${tone}`}>{row[key]}</p>
                  <p className="text-[10px] text-text-secondary">{label}</p>
                </div>
              ))}
            </div>
          )}
          <AttendanceCalendar branchId={payment.branchId} staffId={payment.staffId} initialMonth={payment.month} />
        </section>
      </div>
    </Drawer>
  );
}
