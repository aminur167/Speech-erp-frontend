"use client";

import { useState } from "react";
import { Gift, Pencil } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { StaffAvatar } from "@/components/staff/StaffAvatar";
import { SalaryPaymentSection } from "@/components/staff/SalaryPaymentSection";
import { useUpdateStaff } from "@/hooks/staff/useUpdateStaff";
import { useAddBonus } from "@/hooks/staff/useAddBonus";
import { useStaffBonuses } from "@/hooks/staff/useStaffBonuses";
import { AttendanceCalendar } from "@/components/staff/AttendanceCalendar";
import { formatCurrency } from "@/utils/currency";
import { humanizeField } from "@/utils/fields";
import type { StaffMember } from "@/types/domain";

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
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
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <StaffAvatar name={staff.name} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">{staff.name}</p>
            <p className="font-mono text-xs text-text-secondary">{staff.staffCode}</p>
          </div>
          <Badge
            tone={staff.status === "active" ? "success" : "neutral"}
            label={staff.status}
            className="ml-auto"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5 rounded-lg border border-border p-2.5 text-sm">
          <div>
            <p className="text-[11px] text-text-secondary">Designation</p>
            <p className="font-medium text-text-primary">{humanizeField(staff.designation)}</p>
          </div>
          <div>
            <p className="text-[11px] text-text-secondary">Joined</p>
            <p className="font-medium text-text-primary">{formatDate(staff.joinedAt)}</p>
          </div>
          <div>
            <p className="text-[11px] text-text-secondary">Phone</p>
            <p className="font-medium text-text-primary">{staff.phone}</p>
          </div>
          <div>
            <p className="text-[11px] text-text-secondary">Email</p>
            <p className="truncate font-medium text-text-primary">{staff.email || "—"}</p>
          </div>
        </div>

        <section className="flex flex-col gap-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Salary</h3>
          {isEditingSalary ? (
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                step="0.01"
                value={salaryDraft}
                onChange={(event) => setSalaryDraft(event.target.value)}
                containerClassName="w-auto flex-1"
              />
              <Button className="px-2.5 py-1 text-xs" onClick={saveSalary} isLoading={updateStaff.isPending}>
                Save
              </Button>
              <Button
                variant="secondary"
                className="px-2.5 py-1 text-xs"
                onClick={() => setIsEditingSalary(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-border p-2.5">
              <div>
                <p className="text-[11px] text-text-secondary">Monthly Salary</p>
                <p className="text-base font-semibold text-text-primary">
                  {formatCurrency(staff.monthlySalary)}
                </p>
              </div>
              <Button variant="secondary" className="px-2.5 py-1 text-xs" onClick={startEditingSalary}>
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
            </div>
          )}
        </section>

        <SalaryPaymentSection staff={staff} />

        <section className="flex flex-col gap-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Bonuses</h3>
          <div className="rounded-lg border border-border p-2.5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-text-secondary">
                {bonusesLoading
                  ? "Loading bonuses…"
                  : bonuses && bonuses.length > 0
                    ? `${bonuses.length} bonus${bonuses.length === 1 ? "" : "es"} awarded`
                    : "No bonuses awarded yet."}
              </p>
              {!isAddingBonus && (
                <Button
                  variant="secondary"
                  className="shrink-0 px-2 py-1 text-xs"
                  onClick={() => setIsAddingBonus(true)}
                >
                  <Gift className="h-3 w-3" />
                  Add Bonus
                </Button>
              )}
            </div>

            {isAddingBonus && (
              <div className="mt-2 flex flex-col gap-1.5 border-t border-border pt-2">
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
                <div className="flex justify-end gap-1.5">
                  <Button
                    variant="secondary"
                    className="px-2.5 py-1 text-xs"
                    onClick={() => setIsAddingBonus(false)}
                  >
                    Cancel
                  </Button>
                  <Button className="px-2.5 py-1 text-xs" onClick={submitBonus} isLoading={addBonus.isPending}>
                    Award Bonus
                  </Button>
                </div>
              </div>
            )}

            {!isAddingBonus && !bonusesLoading && bonuses && bonuses.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1.5 border-t border-border pt-2">
                {bonuses.map((bonus) => (
                  <li key={bonus.id} className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-text-primary">{bonus.reason}</p>
                      <p className="text-[11px] text-text-secondary">
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
          </div>
        </section>

        <section className="flex flex-col gap-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Attendance History
          </h3>
          <AttendanceCalendar branchId={branchId} staffId={staff.id} />
        </section>
      </div>
    </Drawer>
  );
}
