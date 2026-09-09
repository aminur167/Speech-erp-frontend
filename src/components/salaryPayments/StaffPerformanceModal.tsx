"use client";

import { Modal } from "@/components/ui/Modal";
import { LoadingState } from "@/components/ui/states";
import { StaffAvatar } from "@/components/staff/StaffAvatar";
import { AttendanceCalendar } from "@/components/staff/AttendanceCalendar";
import { useMonthlyStaffReport } from "@/hooks/staff/useMonthlyStaffReport";
import { formatCurrency } from "@/utils/currency";
import type { SalaryPayment } from "@/types/domain";

function monthLabel(month: string): string {
  return new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });
}

const STATS: { key: "presentCount" | "earlyLeaveCount" | "leaveCount" | "absentCount"; label: string; tone: string }[] = [
  { key: "presentCount", label: "Present", tone: "text-success" },
  { key: "earlyLeaveCount", label: "Early Leave", tone: "text-warning" },
  { key: "leaveCount", label: "On Leave", tone: "text-info" },
  { key: "absentCount", label: "Absent", tone: "text-danger" },
];

/**
 * What Admin sees before deciding on a salary request — this month's
 * attendance breakdown and calendar for the staff member being paid, so the
 * approval isn't a blind rubber stamp.
 */
export function StaffPerformanceModal({
  payment,
  onClose,
}: {
  payment: SalaryPayment | null;
  onClose: () => void;
}) {
  const { data: rows, isLoading } = useMonthlyStaffReport(payment?.branchId, payment?.month);
  const row = rows?.find((r) => r.staffId === payment?.staffId);

  if (!payment) return null;

  return (
    <Modal open={Boolean(payment)} onClose={onClose} title="Staff Performance" className="max-w-lg">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <StaffAvatar name={payment.staffName} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">{payment.staffName}</p>
            <p className="font-mono text-xs text-text-secondary">
              {payment.staffCode} · {payment.branchName}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border p-2.5">
          <p className="text-[11px] text-text-secondary">Requested for {monthLabel(payment.month)}</p>
          <p className="text-base font-semibold text-text-primary">{formatCurrency(payment.amount)}</p>
        </div>

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
      </div>
    </Modal>
  );
}
