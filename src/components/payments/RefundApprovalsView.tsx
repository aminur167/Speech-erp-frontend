"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/states";
import { PageHeader } from "@/components/layout/PageHeader";
import { BranchFilterSelect } from "@/components/ui/BranchFilterSelect";
import { FilterBar } from "@/components/ui/FilterBar";
import { useRefundRequests } from "@/hooks/payments/useRefundRequests";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/currency";
import { ApproveRefundModal } from "@/components/payments/ApproveRefundModal";
import { RejectRefundModal } from "@/components/payments/RejectRefundModal";
import type { RefundRequest, RefundRequestStatus } from "@/types/domain";

const PAGE_SIZE = 10;

const STATUS_TONE: Record<RefundRequestStatus, "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

export function RefundApprovalsView() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "admin";

  const [status, setStatus] = useState<RefundRequestStatus | "">("pending");
  const [branchId, setBranchId] = useState("");
  const [page, setPage] = useState(1);
  const [approving, setApproving] = useState<RefundRequest | null>(null);
  const [rejecting, setRejecting] = useState<RefundRequest | null>(null);

  const { data, isLoading, isError, refetch } = useRefundRequests({
    status: status || undefined,
    branchId: branchId || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref="/admin/dashboard"
        breadcrumb={["Admin", "Refund Approvals"]}
        title="Refund Approvals"
        subtitle="Review refund requests a branch manager has opened. Nothing moves until you decide."
      />

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
            setStatus(event.target.value as RefundRequestStatus | "");
            setPage(1);
          }}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </Select>
      </FilterBar>

      <Card>
        <div className="flex flex-col gap-4">
          {isLoading && <LoadingState label="Loading refund requests…" />}
          {isError && <ErrorState onRetry={() => refetch()} />}
          {!isLoading && !isError && data?.results.length === 0 && (
            <EmptyState label="No refund requests here." />
          )}
          {!isLoading && !isError && data && data.results.length > 0 && (
            <>
              <div className="flex flex-col divide-y divide-border">
                {data.results.map((refund) => (
                  <div key={refund.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-text-secondary">
                          {refund.payment.receiptNumber}
                        </span>
                        <Badge tone={STATUS_TONE[refund.status]} label={refund.status} />
                      </div>
                      <p className="text-sm font-medium text-text-primary">
                        {formatCurrency(refund.amount)} — {refund.reason}
                      </p>
                      <p className="text-xs text-text-secondary">
                        Requested by {refund.requestedBy || "—"} on{" "}
                        {new Date(refund.requestedAt).toLocaleString()}
                      </p>
                      {refund.status !== "pending" && (
                        <p className="text-xs text-text-secondary">
                          {refund.status === "approved" ? "Approved" : "Rejected"} by{" "}
                          {refund.reviewedBy || "—"}
                          {refund.reviewNote ? ` — "${refund.reviewNote}"` : ""}
                        </p>
                      )}
                    </div>
                    {isAdmin && refund.status === "pending" && (
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => setRejecting(refund)}
                          className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-danger/40 hover:text-danger"
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => setApproving(refund)}
                          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-dark"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Approve
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                count={data.count}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </Card>

      <ApproveRefundModal refund={approving} onClose={() => setApproving(null)} />
      <RejectRefundModal refund={rejecting} onClose={() => setRejecting(null)} />
    </div>
  );
}
