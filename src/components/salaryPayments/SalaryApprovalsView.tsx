"use client";

import { useState } from "react";
import { Check, FileText, X } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/states";
import { PageHeader } from "@/components/layout/PageHeader";
import { BranchFilterSelect } from "@/components/ui/BranchFilterSelect";
import { FilterBar } from "@/components/ui/FilterBar";
import { useSalaryPayments } from "@/hooks/salaryPayments/useSalaryPayments";
import { useSalaryPaymentBranchSummary } from "@/hooks/salaryPayments/useSalaryPaymentBranchSummary";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/currency";
import { ApproveSalaryPaymentModal } from "@/components/salaryPayments/ApproveSalaryPaymentModal";
import { RejectSalaryPaymentModal } from "@/components/salaryPayments/RejectSalaryPaymentModal";
import { SalaryInvoiceModal } from "@/components/salaryPayments/SalaryInvoiceModal";
import { StaffPerformanceDrawer } from "@/components/salaryPayments/StaffPerformanceDrawer";
import { StaffAvatar } from "@/components/staff/StaffAvatar";
import { cameFromControl } from "@/utils/interactiveClick";
import type { SalaryPayment, SalaryPaymentStatus } from "@/types/domain";

const PAGE_SIZE = 10;

const STATUS_TONE: Record<SalaryPaymentStatus, "warning" | "info" | "danger" | "success"> = {
  pending_approval: "warning",
  approved: "info",
  rejected: "danger",
  paid: "success",
};

const STATUS_BORDER: Record<SalaryPaymentStatus, string> = {
  pending_approval: "border-l-warning",
  approved: "border-l-info",
  rejected: "border-l-danger",
  paid: "border-l-success",
};

function monthLabel(month: string): string {
  return new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });
}

export function SalaryApprovalsView() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "admin";

  const [status, setStatus] = useState<SalaryPaymentStatus | "">("pending_approval");
  const [branchId, setBranchId] = useState("");
  const [page, setPage] = useState(1);
  const [approving, setApproving] = useState<SalaryPayment | null>(null);
  const [rejecting, setRejecting] = useState<SalaryPayment | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<SalaryPayment | null>(null);
  const [viewingPerformance, setViewingPerformance] = useState<SalaryPayment | null>(null);

  const { data, isLoading, isError, refetch } = useSalaryPayments({
    status: status || undefined,
    branchId: branchId || undefined,
    page,
    pageSize: PAGE_SIZE,
  });
  const { data: branchSummary } = useSalaryPaymentBranchSummary();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref="/admin/dashboard"
        breadcrumb={["Admin", "Salary Approvals"]}
        title="Salary Approvals"
        subtitle="Review salary payment requests a branch manager has opened. Nothing is paid until you decide."
      />

      {branchSummary && branchSummary.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {branchSummary.map((row) => (
            <div
              key={row.branchId}
              className="rounded-xl border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_1px_6px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate text-sm font-semibold text-text-primary">{row.branchName}</h3>
                <span className="shrink-0 rounded-full bg-primary-light px-2 py-0.5 text-[11px] font-medium text-primary-dark">
                  {row.paymentCount} payment{row.paymentCount === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 divide-x divide-border text-center">
                <div className="px-1">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-text-secondary">
                    Awaiting
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-warning">
                    {formatCurrency(row.approvedAmount)}
                  </p>
                </div>
                <div className="px-1">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-text-secondary">
                    Paid
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-success">
                    {formatCurrency(row.paidAmount)}
                  </p>
                </div>
                <div className="px-1">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-text-secondary">
                    Total
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-text-primary">
                    {formatCurrency(row.totalApprovedAmount)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <FilterBar>
        <BranchFilterSelect
          value={branchId}
          onChange={(value) => {
            setBranchId(value);
            setPage(1);
          }}
        />
        <Select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as SalaryPaymentStatus | "");
            setPage(1);
          }}
        >
          <option value="pending_approval">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </Select>
      </FilterBar>

      <Card>
        <div className="flex flex-col gap-4">
          {isLoading && <LoadingState label="Loading salary payment requests…" />}
          {isError && <ErrorState onRetry={() => refetch()} />}
          {!isLoading && !isError && data?.results.length === 0 && (
            <EmptyState label="No salary payment requests here." />
          )}
          {!isLoading && !isError && data && data.results.length > 0 && (
            <>
              <div className="flex flex-col divide-y divide-border">
                {data.results.map((payment) => (
                  <div
                    key={payment.id}
                    onClick={(event) => {
                      if (cameFromControl(event)) return;
                      setViewingPerformance(payment);
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      if (cameFromControl(event)) return;
                      event.preventDefault();
                      setViewingPerformance(payment);
                    }}
                    tabIndex={0}
                    title="View staff details"
                    className={clsx(
                      "flex cursor-pointer flex-col gap-3 rounded-lg border-l-4 bg-surface py-4 pl-3 pr-2 transition-colors hover:bg-primary-light/40 focus:outline-none focus-visible:bg-primary-light/40 sm:flex-row sm:items-center sm:justify-between",
                      STATUS_BORDER[payment.status],
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <StaffAvatar name={payment.staffName} photoUrl={payment.staffPhotoUrl || undefined} />
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-text-primary">{payment.staffName}</span>
                          <span className="font-mono text-xs text-text-secondary">
                            {payment.staffCode}
                          </span>
                          <Badge tone={STATUS_TONE[payment.status]} label={payment.status.replace("_", " ")} />
                        </div>
                        <p className="text-base font-semibold text-text-primary">
                          {formatCurrency(payment.amount)}
                          <span className="ml-1.5 text-sm font-normal text-text-secondary">
                            — {monthLabel(payment.month)} · {payment.branchName}
                          </span>
                        </p>
                        <p className="text-xs text-text-secondary">
                          Requested by {payment.requestedBy || "—"} on{" "}
                          {new Date(payment.createdAt).toLocaleString()}
                        </p>
                        {payment.status !== "pending_approval" && payment.reviewedBy && (
                          <p className="text-xs text-text-secondary">
                            {payment.status === "rejected" ? "Rejected" : "Approved"} by{" "}
                            {payment.reviewedBy}
                            {payment.reviewNote ? ` — "${payment.reviewNote}"` : ""}
                          </p>
                        )}
                        {payment.status === "paid" && (
                          <p className="text-xs text-text-secondary">
                            Paid via {payment.paymentMethod.replace("_", " ")} — logged as{" "}
                            <span className="font-mono">{payment.expenseCode}</span> in Expenses.
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {(payment.status === "approved" || payment.status === "paid") && (
                        <button
                          type="button"
                          onClick={() => setViewingInvoice(payment)}
                          className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-primary/40 hover:text-primary"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Invoice
                        </button>
                      )}
                      {isAdmin && payment.status === "pending_approval" && (
                        <>
                          <button
                            type="button"
                            onClick={() => setRejecting(payment)}
                            className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-danger/40 hover:text-danger"
                          >
                            <X className="h-3.5 w-3.5" />
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => setApproving(payment)}
                            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-dark"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Approve
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Pagination page={page} pageSize={PAGE_SIZE} count={data.count} onPageChange={setPage} />
            </>
          )}
        </div>
      </Card>

      <ApproveSalaryPaymentModal payment={approving} onClose={() => setApproving(null)} />
      <RejectSalaryPaymentModal payment={rejecting} onClose={() => setRejecting(null)} />
      <SalaryInvoiceModal payment={viewingInvoice} onClose={() => setViewingInvoice(null)} />
      <StaffPerformanceDrawer payment={viewingPerformance} onClose={() => setViewingPerformance(null)} />
    </div>
  );
}
