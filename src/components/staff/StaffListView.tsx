"use client";

import { useState } from "react";
import { CalendarOff, Download, Plus, UserCheck, Users, Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { StatCard } from "@/components/dashboard/StatCard";
import { StaffTable } from "@/components/staff/StaffTable";
import { StaffForm } from "@/components/staff/StaffForm";
import { StaffDetailDrawer } from "@/components/staff/StaffDetailDrawer";
import { useStaff } from "@/hooks/staff/useStaff";
import { useStaffSummary } from "@/hooks/staff/useStaffSummary";
import { useTodayAttendance } from "@/hooks/staff/useTodayAttendance";
import { useMonthlyStaffReport } from "@/hooks/staff/useMonthlyStaffReport";
import { useCreateStaff } from "@/hooks/staff/useCreateStaff";
import { useUpdateStaff } from "@/hooks/staff/useUpdateStaff";
import { useDeleteStaff } from "@/hooks/staff/useDeleteStaff";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/currency";
import { exportToCsv } from "@/utils/exportCsv";
import type { StaffInput } from "@/lib/api/staff";
import type { StaffMember } from "@/types/domain";

const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

export function StaffListView() {
  const user = useAuthStore((state) => state.user);
  // Undefined for a Manager, whose branch the backend already knows.
  const branchId = branchIdOverride ?? user?.branchId ?? undefined;

  const { data: staff, isLoading } = useStaff(branchId);
  const { data: summary } = useStaffSummary(branchId);
  const { data: todayAttendance } = useTodayAttendance(branchId);
  const { data: monthlyReport } = useMonthlyStaffReport(branchId, currentMonth);
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const deleteStaffMutation = useDeleteStaff();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);
  // An id, not the object itself -- salary edits and bonuses mutate the staff
  // list while this drawer is open, and re-deriving from the freshly
  // refetched `staff` array is what keeps the drawer from showing a stale
  // snapshot of the member taken at the moment "Details" was clicked.
  const [viewingStaffId, setViewingStaffId] = useState<string | null>(null);
  const viewingStaff = staff?.find((member) => member.id === viewingStaffId) ?? null;

  const handleCreate = (input: StaffInput) => {
    createStaff.mutate(input, { onSuccess: () => setIsAddOpen(false) });
  };

  const handleUpdate = (input: StaffInput) => {
    if (!editingStaff) return;
    updateStaff.mutate({ id: editingStaff.id, input }, { onSuccess: () => setEditingStaff(null) });
  };

  const handleDelete = () => {
    if (!deletingStaff) return;
    deleteStaffMutation.mutate(deletingStaff.id, { onSuccess: () => setDeletingStaff(null) });
  };

  const handleExport = () => {
    exportToCsv(
      `staff-monthly-report-${currentMonth}.csv`,
      (monthlyReport ?? []).map((row) => ({
        "Staff Code": row.staffCode,
        Name: row.name,
        Designation: row.designation,
        "Monthly Salary": row.monthlySalary,
        Bonus: row.bonusTotal,
        "Net Payable": row.netPayable,
        Present: row.presentCount,
        Late: row.lateCount,
        Absent: row.absentCount,
        "On Leave": row.leaveCount,
      })),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref={homeHref}
        breadcrumb={[roleLabel, "Staff"]}
        title="Staff"
        subtitle="Manage the team, track daily attendance, and handle salary and bonuses."
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleExport}
              disabled={!monthlyReport || monthlyReport.length === 0}
            >
              <Download className="h-4 w-4" />
              Export Monthly Report
            </Button>
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Staff
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Staff" value={String(summary?.totalStaff ?? 0)} icon={Users} />
        <StatCard
          label="Present Today"
          value={String(summary?.presentToday ?? 0)}
          icon={UserCheck}
          tone="success"
        />
        <StatCard
          label="On Leave / Absent"
          value={String(summary?.onLeaveToday ?? 0)}
          icon={CalendarOff}
          tone={summary && summary.onLeaveToday > 0 ? "warning" : "primary"}
        />
        <StatCard
          label="Monthly Payroll"
          value={formatCurrency((summary?.monthlySalaryPayout ?? 0) + (summary?.monthlyBonusPayout ?? 0))}
          icon={Wallet}
          hint={summary ? `incl. ${formatCurrency(summary.monthlyBonusPayout)} bonus` : undefined}
          tone="purple"
        />
      </div>

      <Card>
        {isLoading && <LoadingState label="Loading staff…" />}
        {!isLoading && (!staff || staff.length === 0) && <EmptyState label="No staff added yet." />}
        {!isLoading && staff && staff.length > 0 && (
          <StaffTable
            staff={staff}
            todayAttendance={todayAttendance ?? {}}
            onViewDetails={(member) => setViewingStaffId(member.id)}
            onEdit={setEditingStaff}
            onDelete={setDeletingStaff}
          />
        )}
      </Card>

      <Modal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Staff"
        description="Add a new team member to this branch."
      >
        <StaffForm onSubmit={handleCreate} onCancel={() => setIsAddOpen(false)} isSubmitting={createStaff.isPending} />
      </Modal>

      <Modal open={Boolean(editingStaff)} onClose={() => setEditingStaff(null)} title="Edit Staff">
        {editingStaff && (
          <StaffForm
            initialValues={editingStaff}
            onSubmit={handleUpdate}
            onCancel={() => setEditingStaff(null)}
            isSubmitting={updateStaff.isPending}
          />
        )}
      </Modal>

      <StaffDetailDrawer staff={viewingStaff} onClose={() => setViewingStaffId(null)} />

      <ConfirmDialog
        open={Boolean(deletingStaff)}
        onClose={() => setDeletingStaff(null)}
        onConfirm={handleDelete}
        title="Remove staff member?"
        description={`"${deletingStaff?.name}" will be removed from your team. This can't be undone.`}
        confirmLabel="Remove"
        danger
        isLoading={deleteStaffMutation.isPending}
      />
    </div>
  );
}
