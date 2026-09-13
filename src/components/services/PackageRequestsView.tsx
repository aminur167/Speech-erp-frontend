"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/states";
import { PageHeader } from "@/components/layout/PageHeader";
import { BranchFilterSelect } from "@/components/ui/BranchFilterSelect";
import { FilterBar } from "@/components/ui/FilterBar";
import { ReviewPackageActionModal } from "@/components/services/ReviewPackageActionModal";
import { usePackageActionRequests } from "@/hooks/services/usePackageActionRequests";
import type {
  PackageAction,
  PackageActionRequest,
  PackageActionRequestStatus,
} from "@/types/domain";

const PAGE_SIZE = 10;

const STATUS_TONE: Record<
  PackageActionRequestStatus,
  "warning" | "success" | "danger" | "info" | "neutral"
> = {
  pending: "warning",
  approved: "success",
  used: "info",
  rejected: "danger",
  expired: "neutral",
};

const STATUS_LABEL: Record<PackageActionRequestStatus, string> = {
  pending: "Pending",
  approved: "Approved — not used yet",
  used: "Approved & used",
  rejected: "Rejected",
  expired: "Expired unused",
};

const ACTION_LABEL: Record<PackageAction, string> = {
  edit: "Edit",
  delete: "Delete",
  deactivate: "Deactivate",
  activate: "Activate",
};

const ACTION_TONE: Record<PackageAction, "info" | "danger" | "warning" | "success"> = {
  edit: "info",
  delete: "danger",
  deactivate: "warning",
  activate: "success",
};

function when(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "—";
}

/**
 * Admin's queue of Managers asking to change a package — edit, delete,
 * deactivate or activate — each with the Manager's reason.
 */
export function PackageRequestsView() {
  const [status, setStatus] = useState<PackageActionRequestStatus | "">("pending");
  const [branchId, setBranchId] = useState("");
  const [page, setPage] = useState(1);
  const [deciding, setDeciding] = useState<{
    request: PackageActionRequest;
    mode: "approve" | "reject";
  } | null>(null);

  const { data, isLoading, isError, refetch } = usePackageActionRequests({
    status: status || undefined,
    branchId: branchId || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Package Requests" />

      <FilterBar>
        <BranchFilterSelect
          value={branchId}
          onChange={(value) => {
            setBranchId(value);
            setPage(1);
          }}
        />
        <Select
          label="Status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as PackageActionRequestStatus | "");
            setPage(1);
          }}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved — not used yet</option>
          <option value="used">Approved &amp; used</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired unused</option>
          <option value="">All</option>
        </Select>
      </FilterBar>

      <Card>
        <div className="flex flex-col gap-4">
          {isLoading && <LoadingState label="Loading package requests…" />}
          {isError && <ErrorState onRetry={() => refetch()} />}
          {!isLoading && !isError && data?.results.length === 0 && (
            <EmptyState label="No package requests here." />
          )}
          {!isLoading && !isError && data && data.results.length > 0 && (
            <>
              <div className="flex flex-col divide-y divide-border">
                {data.results.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={ACTION_TONE[request.action]} label={ACTION_LABEL[request.action]} />
                        <span className="font-medium text-text-primary">{request.serviceName}</span>
                        <span className="font-mono text-xs text-text-secondary">
                          {request.serviceCode}
                        </span>
                        <Badge tone={STATUS_TONE[request.status]} label={STATUS_LABEL[request.status]} />
                      </div>
                      <p className="text-sm text-text-primary">
                        <span className="text-text-secondary">Reason: </span>
                        {request.reason}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {request.branchName} · requested by {request.requestedBy || "—"} on{" "}
                        {when(request.requestedAt)}
                      </p>
                      {request.status !== "pending" && (
                        <p className="text-xs text-text-secondary">
                          {request.status === "rejected" ? "Rejected" : "Approved"} by{" "}
                          {request.reviewedBy || "—"} on {when(request.reviewedAt)}
                          {request.reviewNote ? ` — "${request.reviewNote}"` : ""}
                        </p>
                      )}
                      {request.status === "approved" && (
                        <p className="text-xs text-success">Usable until {when(request.expiresAt)}</p>
                      )}
                      {request.status === "used" && (
                        <p className="text-xs text-text-secondary">Used on {when(request.usedAt)}</p>
                      )}
                    </div>
                    {request.status === "pending" && (
                      <ActionMenu
                        label={`Actions for the request on ${request.serviceName}`}
                        items={[
                          {
                            key: "approve",
                            label: "Approve",
                            icon: Check,
                            onSelect: () => setDeciding({ request, mode: "approve" }),
                          },
                          {
                            key: "reject",
                            label: "Reject",
                            icon: X,
                            tone: "danger",
                            onSelect: () => setDeciding({ request, mode: "reject" }),
                          },
                        ]}
                      />
                    )}
                  </div>
                ))}
              </div>
              <Pagination page={page} pageSize={PAGE_SIZE} count={data.count} onPageChange={setPage} />
            </>
          )}
        </div>
      </Card>

      <ReviewPackageActionModal
        request={deciding?.request ?? null}
        mode={deciding?.mode ?? null}
        onClose={() => setDeciding(null)}
      />
    </div>
  );
}
