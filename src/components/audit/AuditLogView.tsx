"use client";

import { Fragment, useState } from "react";
import { RefreshCw } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/states";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar, FILTER_FIELD_WIDTH } from "@/components/ui/FilterBar";
import { useAuditLogs } from "@/hooks/audit/useAuditLogs";
import type { AuditLogAction } from "@/types/domain";

const PAGE_SIZE = 10;

const ACTION_LABELS: Record<AuditLogAction, string> = {
  create: "Create",
  update: "Update",
  soft_delete: "Delete",
  approve: "Approve",
  reject: "Reject",
  void: "Void",
  refund_request: "Refund requested",
  refund_approve: "Refund approved",
  refund_reject: "Refund rejected",
  terminate: "Terminate",
  amend: "Amend",
  write_off: "Write off",
  login: "Login",
};

const ACTION_TONE: Record<AuditLogAction, string> = {
  create: "bg-success/10 text-success",
  update: "bg-info/10 text-info",
  soft_delete: "bg-danger/10 text-danger",
  approve: "bg-success/10 text-success",
  reject: "bg-danger/10 text-danger",
  void: "bg-danger/10 text-danger",
  refund_request: "bg-warning/10 text-warning",
  refund_approve: "bg-success/10 text-success",
  refund_reject: "bg-danger/10 text-danger",
  terminate: "bg-danger/10 text-danger",
  amend: "bg-warning/10 text-warning",
  write_off: "bg-warning/10 text-warning",
  login: "bg-info/10 text-info",
};

export function AuditLogView({ homeHref }: { homeHref: string }) {
  const [action, setAction] = useState<AuditLogAction | "">("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, isFetching, isError, refetch } = useAuditLogs({
    action: action || undefined,
    page,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref={homeHref}
        breadcrumb={["Admin", "Audit Log"]}
        title="Audit Log"
        subtitle="Who approved, rejected, voided, or edited what — across every branch."
      />

      <FilterBar>
        <Select
          value={action}
          onChange={(event) => {
            setAction(event.target.value as AuditLogAction | "");
            setPage(1);
          }}
          containerClassName={FILTER_FIELD_WIDTH}
        >
          <option value="">All actions</option>
          {Object.entries(ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </FilterBar>

      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={clsx("h-4 w-4", isFetching && "animate-spin")} />
              Refresh
            </Button>
          </div>

          {isLoading && <LoadingState label="Loading audit log…" />}
          {isError && <ErrorState onRetry={() => refetch()} />}
          {!isLoading && !isError && data?.results.length === 0 && (
            <EmptyState label="No audit entries found." />
          )}

          {!isLoading && !isError && data && data.results.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs font-medium text-text-secondary">
                      <th className="py-2 pr-3">Timestamp</th>
                      <th className="py-2 pr-3">Actor</th>
                      <th className="py-2 pr-3">Action</th>
                      <th className="py-2 pr-3">Target</th>
                      <th className="py-2 pr-3">Branch</th>
                      <th className="py-2 pr-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((entry) => (
                      <Fragment key={entry.id}>
                        <tr
                          className={clsx(
                            "border-b border-border/60",
                            Object.keys(entry.changes).length > 0 &&
                              "cursor-pointer hover:bg-primary-light/30",
                          )}
                          onClick={() =>
                            Object.keys(entry.changes).length > 0 &&
                            setExpandedId(expandedId === entry.id ? null : entry.id)
                          }
                        >
                          <td className="py-2 pr-3 whitespace-nowrap text-text-secondary">
                            {new Date(entry.createdAt).toLocaleString()}
                          </td>
                          <td className="py-2 pr-3">{entry.actorEmail || "System"}</td>
                          <td className="py-2 pr-3">
                            <span
                              className={clsx(
                                "rounded-full px-2 py-0.5 text-xs font-medium",
                                ACTION_TONE[entry.action],
                              )}
                            >
                              {ACTION_LABELS[entry.action]}
                            </span>
                          </td>
                          <td className="py-2 pr-3 font-mono text-xs text-text-secondary">
                            {entry.targetType}#{entry.targetId}
                          </td>
                          <td className="py-2 pr-3 text-text-secondary">
                            {entry.branchName ?? "—"}
                          </td>
                          <td className="py-2 pr-3 text-text-secondary">{entry.reason || "—"}</td>
                        </tr>
                        {expandedId === entry.id && (
                          <tr className="border-b border-border/60 bg-background">
                            <td colSpan={6} className="px-3 py-3">
                              <p className="mb-1.5 text-xs font-medium text-text-secondary">
                                What changed
                              </p>
                              <div className="flex flex-col gap-1 font-mono text-xs">
                                {Object.entries(entry.changes).map(([field, diff]) => (
                                  <div key={field}>
                                    <span className="text-text-secondary">{field}:</span>{" "}
                                    <span className="text-danger line-through">
                                      {String(diff.from)}
                                    </span>{" "}
                                    → <span className="text-success">{String(diff.to)}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
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
    </div>
  );
}
