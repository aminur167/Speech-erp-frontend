"use client";

import { useState } from "react";
import { Download, Wallet } from "lucide-react";
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
import { useStaff } from "@/hooks/staff/useStaff";
import { useMonthlyStaffReport } from "@/hooks/staff/useMonthlyStaffReport";
import { useSalaryPayments } from "@/hooks/salaryPayments/useSalaryPayments";
import { useRequestSalaryPayment } from "@/hooks/salaryPayments/useRequestSalaryPayment";
import { useDisburseSalaryPayment } from "@/hooks/salaryPayments/useDisburseSalaryPayment";
import { useAdvances } from "@/hooks/staff/useStaffAdvances";
import { exportTableToPdf, formatCurrencyForPdf } from "@/utils/exportPdf";
import { formatCurrency } from "@/utils/currency";
import { humanizeField } from "@/utils/fields";
import type {
  PaymentMethod,
  SalaryPayment,
  SalaryPaymentStatus,
} from "@/types/domain";

function currentMonthIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const STATUS_TONE: Record<SalaryPaymentStatus, "info" | "warning" | "success" | "danger"> = {
  pending_approval: "warning",
  approved: "info",
  rejected: "danger",
  paid: "success",
};

/**
 * One month's payroll for the branch, one row per staff member.
 *
 * This is the half of the old staff table that was invisible: the salary
 * workflow lived inside the detail drawer, so answering "whose salary have I
 * not requested yet" meant opening every person in turn. The state is on the
 * row now, with the one button that moves it forward.
 *
 * **Approve and Reject are deliberately absent.** Those are Admin's, on
 * `/admin/salary-approvals`, where one queue spans every branch. This screen
 * is the manager's side of the same workflow: ask, watch, pay out.
 */
export function StaffPayrollView({
  branchId,
  basePath,
  roleLabel,
}: {
  /** Admin only — a Manager is scoped to their own branch server-side. */
  branchId?: string;
  basePath: string;
  roleLabel: string;
}) {
  const [month, setMonth] = useState(currentMonthIso());
  const [payingOut, setPayingOut] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("cash");

  const { data: staff } = useStaff(branchId);
  const { data: report, isLoading } = useMonthlyStaffReport(branchId, month);
  const { data: payments } = useSalaryPayments({ branchId, month, pageSize: 200 });
  const { data: advances } = useAdvances({ branchId, status: "paid" });

  const requestPayment = useRequestSalaryPayment();
  const disbursePayment = useDisburseSalaryPayment();

  const rows = report ?? [];
  const photoById = new Map((staff ?? []).map((member) => [member.id, member.photoUrl]));

  // One request per staff member per month — the server refuses a second
  // live one — so a map by staff id is the whole lookup.
  const paymentByStaff = new Map<string, SalaryPayment>(
    (payments?.results ?? []).map((payment) => [payment.staffId, payment]),
  );

  // What each person still owes back. Advances are recovered oldest-first
  // from whatever salary is requested next, so this is what the next request
  // will take off.
  const advanceByStaff = new Map<string, number>();
  for (const advance of advances ?? []) {
    if (advance.outstanding <= 0) continue;
    advanceByStaff.set(
      advance.staffId,
      (advanceByStaff.get(advance.staffId) ?? 0) + advance.outstanding,
    );
  }

  const totals = {
    payable: rows.reduce((sum, row) => sum + row.netPayable, 0),
    requested: rows.filter((row) => paymentByStaff.has(row.staffId)).length,
    awaitingAdmin: [...paymentByStaff.values()].filter(
      (payment) => payment.status === "pending_approval",
    ).length,
    toPayOut: [...paymentByStaff.values()].filter(
      (payment) => payment.status === "approved",
    ).length,
  };

  const monthLabel = new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });

  const handleExport = () => {
    exportTableToPdf({
      filename: `staff-payroll-${month}.pdf`,
      title: "Staff Payroll",
      subtitle: `${roleLabel} — ${monthLabel}`,
      columns: [
        "Staff Code",
        "Name",
        "Designation",
        "Monthly Salary",
        "Bonus",
        "Advance Due",
        "Net Payable",
        "Salary Status",
        "Present",
        "Absent",
      ],
      rows: rows.map((row) => [
        row.staffCode,
        row.name,
        humanizeField(row.designation),
        formatCurrencyForPdf(row.monthlySalary),
        formatCurrencyForPdf(row.bonusTotal),
        formatCurrencyForPdf(advanceByStaff.get(row.staffId) ?? 0),
        formatCurrencyForPdf(row.netPayable),
        paymentByStaff.has(row.staffId)
          ? humanizeField(paymentByStaff.get(row.staffId)!.status)
          : "Not requested",
        row.presentCount,
        row.absentCount,
      ]),
    });
  };

  const GRID = "grid grid-cols-[36px_1fr_120px_120px_150px_130px] items-center gap-3";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Staff" />
      <StaffTabs base={basePath} />

      <FilterBar
        dateSlot={
          <Input
            label="Month"
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value || currentMonthIso())}
            containerClassName="w-auto"
          />
        }
        actions={
          <Button variant="secondary" onClick={handleExport} disabled={rows.length === 0}>
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Net payable"
          value={formatCurrency(totals.payable)}
          icon={Wallet}
          tone="purple"
        />
        <StatCard
          label="Requested"
          value={`${totals.requested} of ${rows.length}`}
        />
        <StatCard
          label="Awaiting Admin"
          value={String(totals.awaitingAdmin)}
          tone={totals.awaitingAdmin > 0 ? "warning" : "primary"}
        />
        <StatCard
          label="Ready to pay out"
          value={String(totals.toPayOut)}
          tone={totals.toPayOut > 0 ? "success" : "primary"}
        />
      </div>

      <Card>
        {isLoading && <LoadingState label="Loading payroll…" />}
        {!isLoading && rows.length === 0 && <EmptyState label="No staff this month." />}

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
              <span className="text-right">Salary + bonus</span>
              <span className="text-right">Advance due</span>
              <span>Salary status</span>
              <span />
            </div>

            {rows.map((row) => {
              const payment = paymentByStaff.get(row.staffId);
              const advanceDue = advanceByStaff.get(row.staffId) ?? 0;
              const isPaying = payingOut === row.staffId;

              return (
                <div
                  key={row.staffId}
                  className={clsx(GRID, "border-b border-border px-1 py-2.5 last:border-b-0")}
                >
                  <StaffAvatar
                    name={row.name}
                    photoUrl={photoById.get(row.staffId)}
                    size="sm"
                  />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {row.name}
                    </p>
                    <p className="truncate text-xs text-text-secondary">
                      {humanizeField(row.designation)}
                    </p>
                  </div>

                  <span className="text-right text-sm tabular-nums text-text-primary">
                    {formatCurrency(row.netPayable)}
                  </span>

                  <span
                    className={clsx(
                      "text-right text-sm tabular-nums",
                      advanceDue > 0 ? "text-warning" : "text-text-secondary",
                    )}
                  >
                    {advanceDue > 0 ? formatCurrency(advanceDue) : "—"}
                  </span>

                  <div className="flex flex-col gap-0.5">
                    {payment ? (
                      <>
                        <Badge
                          tone={STATUS_TONE[payment.status]}
                          label={humanizeField(payment.status)}
                        />
                        {/* The arithmetic, where there is any: a request
                            whose figure is smaller than the month's net is
                            otherwise unexplainable on this screen. */}
                        {(payment.advanceDeduction ?? 0) > 0 && (
                          <span className="text-[11px] text-text-secondary">
                            {formatCurrency(payment.grossAmount ?? 0)} −{" "}
                            {formatCurrency(payment.advanceDeduction ?? 0)} ={" "}
                            {formatCurrency(payment.amount)}
                          </span>
                        )}
                      </>
                    ) : (
                      <Badge tone="info" label="Not requested" />
                    )}
                  </div>

                  <div className="flex justify-end">
                    {!payment && (
                      <Button
                        variant="secondary"
                        className="px-2 py-1 text-xs"
                        onClick={() =>
                          requestPayment.mutate({ staffId: row.staffId, month })
                        }
                        isLoading={
                          requestPayment.isPending &&
                          requestPayment.variables?.staffId === row.staffId
                        }
                      >
                        Request salary
                      </Button>
                    )}

                    {payment?.status === "approved" && !isPaying && (
                      <Button
                        className="px-2 py-1 text-xs"
                        onClick={() => setPayingOut(row.staffId)}
                      >
                        Disburse
                      </Button>
                    )}

                    {payment?.status === "approved" && isPaying && (
                      <div className="flex items-center gap-1">
                        <select
                          className="rounded-lg border border-border bg-surface px-2 py-1 text-xs"
                          value={method}
                          aria-label={`Payment method for ${row.name}`}
                          onChange={(event) =>
                            setMethod(event.target.value as PaymentMethod)
                          }
                        >
                          <option value="cash">Cash</option>
                          <option value="bkash">bKash</option>
                          <option value="bank_transfer">Bank transfer</option>
                        </select>
                        <Button
                          className="px-2 py-1 text-xs"
                          isLoading={disbursePayment.isPending}
                          onClick={() =>
                            disbursePayment.mutate(
                              { id: payment.id, paymentMethod: method },
                              { onSuccess: () => setPayingOut(null) },
                            )
                          }
                        >
                          Pay
                        </Button>
                        <Button
                          variant="ghost"
                          className="px-2 py-1 text-xs"
                          onClick={() => setPayingOut(null)}
                        >
                          Cancel
                        </Button>
                      </div>
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
