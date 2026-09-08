"use client";

import { useState } from "react";
import { Gift, Pencil } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { StaffAvatar } from "@/components/staff/StaffAvatar";
import { SalaryPaymentSection } from "@/components/staff/SalaryPaymentSection";
import { useUpdateStaff } from "@/hooks/staff/useUpdateStaff";
import { useAddBonus } from "@/hooks/staff/useAddBonus";
import { useStaffBonuses } from "@/hooks/staff/useStaffBonuses";
import { useStaffAttendanceHistory } from "@/hooks/staff/useStaffAttendanceHistory";
import { formatCurrency } from "@/utils/currency";
import { humanizeField } from "@/utils/fields";
import type { StaffAttendance, StaffMember } from "@/types/domain";

const attendanceTone: Record<StaffAttendance["status"], "success" | "warning" | "info" | "danger"> = {
  present: "success",
  late: "warning",
  on_leave: "info",
  absent: "danger",
};

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function StaffDetailDrawer({
  branchId,
  staff,
  onClose,
}: {
  /** Admin only — a Manager is scoped to their own branch server-side. */
  branchId?: string;
  staff: StaffMember | null;
  onClose: () => void;
}) {
  const updateStaff = useUpdateStaff(branchId);
  const addBonus = useAddBonus(branchId);
  const { data: bonuses, isLoading: bonusesLoading } = useStaffBonuses(branchId, staff?.id);
  const { data: history, isLoading: historyLoading } = useStaffAttendanceHistory(branchId, staff?.id);

  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [salaryDraft, setSalaryDraft] = useState("");
  const [isAddingBonus, setIsAddingBonus] = useState(false);
  const [bonusAmount, setBonusAmount] = useState("");
  const [bonusReason, setBonusReason] = useState("");

  if (!staff) return null;

  const startEditingSalary = () => {
    setSalaryDraft(String(staff.monthlySalary));
    setIsEditingSalary(true);
  };

  const saveSalary = () => {
    const amount = Number(salaryDraft);
    if (!Number.isFinite(amount) || amount < 0) return;
    updateStaff.mutate(
      {
        id: staff.id,
        input: {
          name: staff.name,
          designation: staff.designation,
          phone: staff.phone,
          email: staff.email,
          joinedAt: staff.joinedAt,
          monthlySalary: amount,
          status: staff.status,
        },
      },
      { onSuccess: () => setIsEditingSalary(false) },
    );
  };

  const submitBonus = () => {
    const amount = Number(bonusAmount);
    if (!Number.isFinite(amount) || amount <= 0 || !bonusReason.trim()) return;
    addBonus.mutate(
      // No `awardedBy`: the server records the authenticated user, so the
      // browser can't credit the bonus to somebody else.
      { staffId: staff.id, amount, reason: bonusReason.trim() },
      {
        onSuccess: () => {
          setIsAddingBonus(false);
          setBonusAmount("");
          setBonusReason("");
        },
      },
    );
  };

  return (
    <Drawer open={Boolean(staff)} onClose={onClose} title="Staff Details">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <StaffAvatar name={staff.name} />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-text-primary">{staff.name}</p>
            <p className="font-mono text-xs text-text-secondary">{staff.staffCode}</p>
          </div>
          <Badge
            tone={staff.status === "active" ? "success" : "neutral"}
            label={staff.status}
            className="ml-auto"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-lg border border-border p-3 text-sm">
          <div>
            <p className="text-xs text-text-secondary">Designation</p>
            <p className="font-medium text-text-primary">{humanizeField(staff.designation)}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Joined</p>
            <p className="font-medium text-text-primary">{formatDate(staff.joinedAt)}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Phone</p>
            <p className="font-medium text-text-primary">{staff.phone}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Email</p>
            <p className="truncate font-medium text-text-primary">{staff.email || "—"}</p>
          </div>
        </div>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-text-primary">Salary</h3>
          {isEditingSalary ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.01"
                value={salaryDraft}
                onChange={(event) => setSalaryDraft(event.target.value)}
                containerClassName="w-auto flex-1"
              />
              <Button onClick={saveSalary} isLoading={updateStaff.isPending}>
                Save
              </Button>
              <Button variant="secondary" onClick={() => setIsEditingSalary(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-xs text-text-secondary">Monthly Salary</p>
                <p className="text-lg font-semibold text-text-primary">
                  {formatCurrency(staff.monthlySalary)}
                </p>
              </div>
              <Button variant="secondary" onClick={startEditingSalary}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            </div>
          )}
        </section>

        <SalaryPaymentSection staff={staff} />

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Bonuses</h3>
            {!isAddingBonus && (
              <Button variant="secondary" onClick={() => setIsAddingBonus(true)}>
                <Gift className="h-3.5 w-3.5" />
                Add Bonus
              </Button>
            )}
          </div>

          {isAddingBonus && (
            <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <Input
                type="number"
                step="0.01"
                placeholder="Bonus Amount (BDT)"
                value={bonusAmount}
                onChange={(event) => setBonusAmount(event.target.value)}
              />
              <Textarea
                placeholder="Reason, e.g. Eid bonus, outstanding performance…"
                rows={2}
                value={bonusReason}
                onChange={(event) => setBonusReason(event.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setIsAddingBonus(false)}>
                  Cancel
                </Button>
                <Button onClick={submitBonus} isLoading={addBonus.isPending}>
                  Award Bonus
                </Button>
              </div>
            </div>
          )}

          {bonusesLoading && <LoadingState label="Loading bonuses…" />}
          {!bonusesLoading && (!bonuses || bonuses.length === 0) && !isAddingBonus && (
            <EmptyState label="No bonuses awarded yet." />
          )}
          {!bonusesLoading && bonuses && bonuses.length > 0 && (
            <ul className="flex flex-col gap-2">
              {bonuses.map((bonus) => (
                <li
                  key={bonus.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate text-text-primary">{bonus.reason}</p>
                    <p className="text-xs text-text-secondary">
                      {new Date(bonus.awardedAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      · {bonus.awardedBy}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-success">{formatCurrency(bonus.amount)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-text-primary">Attendance History</h3>
          {historyLoading && <LoadingState label="Loading attendance…" />}
          {!historyLoading && (!history || history.length === 0) && (
            <EmptyState label="No attendance recorded yet." />
          )}
          {!historyLoading && history && history.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {history.map((record) => (
                <li
                  key={record.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span className="text-text-primary">{formatDate(record.date)}</span>
                  <span className="text-xs text-text-secondary">
                    {formatTime(record.checkInAt)}
                    {record.checkOutAt && ` – ${formatTime(record.checkOutAt)}`}
                  </span>
                  <Badge tone={attendanceTone[record.status]} label={humanizeField(record.status)} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Drawer>
  );
}
