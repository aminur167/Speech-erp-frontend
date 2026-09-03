"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/states";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar, FILTER_FIELD_WIDTH } from "@/components/ui/FilterBar";
import { RowDetailDrawer, useRowDetail } from "@/components/ui/RowDetailDrawer";
import { useAuditLogs } from "@/hooks/audit/useAuditLogs";
import type { AuditLogAction, AuditLogEntry } from "@/types/domain";

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

/** `receipt_number` -> "Receipt number", `patient_code` -> "Patient code". */
function humanizeField(field: string): string {
  const spaced = field.replace(/_/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

/** Renders a recorded value readably — never the literal "undefined"/"null". */
function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

/**
 * A `{from, to}` pair, or a bare recorded value.
 *
 * Both shapes are legitimate (see AuditLogEntry.changes). Rendering a bare
 * value through the pair branch is what printed "undefined → undefined" for
 * every create entry, which is most of the log.
 */
function isTransition(value: unknown): value is { from: unknown; to: unknown } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    ("from" in value || "to" in value)
  );
}

function ChangeRow({ field, value }: { field: string; value: unknown }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-1.5">
      <span className="text-text-secondary">{humanizeField(field)}:</span>
      {isTransition(value) ? (
        <>
          <span className="text-danger line-through">{formatValue(value.from)}</span>
          <span className="text-text-secondary">→</span>
          <span className="font-medium text-success">{formatValue(value.to)}</span>
        </>
      ) : (
        <span className="font-medium text-text-primary">{formatValue(value)}</span>
      )}
    </div>
  );
}

export function AuditLogView({ homeHref }: { homeHref: string }) {
  const [action, setAction] = useState<AuditLogAction | "">("");
  const [page, setPage] = useState(1);
  const detail = useRowDetail<AuditLogEntry>();

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
                      <tr key={entry.id} {...detail.rowProps(entry)}>
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

      <RowDetailDrawer
        open={detail.isOpen}
        onClose={detail.close}
        title={
          detail.selected
            ? `${ACTION_LABELS[detail.selected.action]} · ${detail.selected.targetType}#${detail.selected.targetId}`
            : ""
        }
        subtitle={
          detail.selected ? new Date(detail.selected.createdAt).toLocaleString() : undefined
        }
        // `changes` needs the from/to treatment below, and the heading
        // duplicates what the drawer title already says.
        data={detail.selected}
        hiddenFields={["changes", "targetType", "targetId"]}
      >
        {detail.selected && Object.keys(detail.selected.changes).length > 0 && (
          <div className="mb-4 rounded-lg border border-border bg-background p-3">
            <p className="mb-2 text-xs font-medium text-text-secondary">
              {/* An approval and an edit both carry from/to pairs; a create
                  just records values. */}
              {Object.values(detail.selected.changes).some(isTransition)
                ? "What changed"
                : "What was recorded"}
            </p>
            <div className="flex flex-col gap-1.5 text-xs">
              {Object.entries(detail.selected.changes).map(([field, value]) => (
                <ChangeRow key={field} field={field} value={value} />
              ))}
            </div>
          </div>
        )}
      </RowDetailDrawer>
    </div>
  );
}
