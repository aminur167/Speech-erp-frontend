"use client";

import { useState } from "react";
import { Check, FileText, X } from "lucide-react";
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
import type { SalaryPayment, SalaryPaymentStatus } from "@/types/domain";

const PAGE_SIZE = 10;

const STATUS_TONE: Record<SalaryPaymentStatus, "warning" | "info" | "danger" | "success"> = {
  pending_approval: "warning",
  approved: "info",
  rejected: "danger",
  paid: "success",
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
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-text-primary">
            Branch-wise Approved Salary
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary">
                  <th className="py-2 pr-4 font-medium">Branch</th>
                  <th className="py-2 pr-4 font-medium">Awaiting Payment</th>
                  <th className="py-2 pr-4 font-medium">Paid</th>
                  <th className="py-2 pr-4 font-medium">Total Approved</th>
                  <th className="py-2 pr-4 font-medium">Payments</th>
                </tr>
              </thead>
              <tbody>
                {branchSummary.map((row) => (
                  <tr key={row.branchId} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pr-4 font-medium text-text-primary">{row.branchName}</td>
                    <td className="py-2 pr-4 text-text-primary">
                      {formatCurrency(row.approvedAmount)}
                    </td>
                    <td className="py-2 pr-4 text-success">{formatCurrency(row.paidAmount)}</td>
                    <td className="py-2 pr-4 font-semibold text-text-primary">
                      {formatCurrency(row.totalApprovedAmount)}
                    </td>
                    <td className="py-2 pr-4 text-text-secondary">{row.paymentCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-text-primary">{payment.staffName}</span>
                        <span className="font-mono text-xs text-text-secondary">
                          {payment.staffCode}
                        </span>
                        <Badge tone={STATUS_TONE[payment.status]} label={payment.status.replace("_", " ")} />
                      </div>
                      <p className="text-sm font-medium text-text-primary">
                        {formatCurrency(payment.amount)} — {monthLabel(payment.month)} ·{" "}
                        {payment.branchName}
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
    </div>
  );
}
