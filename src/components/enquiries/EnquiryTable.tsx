"use client";

import { useState } from "react";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { Badge } from "@/components/ui/Badge";
import { BranchFilterSelect } from "@/components/ui/BranchFilterSelect";
import { Button } from "@/components/ui/Button";
import { FilterBar, FILTER_FIELD_WIDTH } from "@/components/ui/FilterBar";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { SearchField } from "@/components/ui/SearchField";
import { Select } from "@/components/ui/Select";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EnquiryFormModal } from "@/components/enquiries/EnquiryFormModal";
import { ConvertEnquiryModal } from "@/components/enquiries/ConvertEnquiryModal";
import {
  FOLLOW_UP_OPTIONS,
  SOURCE_LABELS,
  STATUS_LABELS,
  statusTone,
} from "@/components/enquiries/options";
import { useDeleteEnquiry, useEnquiries, useEnquirySummary } from "@/hooks/enquiries/useEnquiries";
import { useAuthStore } from "@/store/authStore";
import { toLocalDateString } from "@/utils/time";
import type { Enquiry } from "@/types/domain";

const PAGE_SIZE = 10;

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Enquiries — the same table for both screens.
 *
 * The Manager works it as their call list; Admin gets a Branch column and a
 * branch filter. `showBranch` is the only difference, because the server
 * already decides what each role may see — the column is presentation, not
 * access.
 */
export function EnquiryTable({ showBranch = false }: { showBranch?: boolean }) {
  // Recording a call and registering the caller are branch-desk actions, and
  // the server refuses both for Admin — they have no branch to file them
  // under. Hiding them is what keeps that a rule rather than an error
  // message after the form has been filled in.
  const canRecord = useAuthStore((state) => state.user)?.role === "manager";

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [branchId, setBranchId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  // Every filter change returns to page 1 — staying on page 4 of a narrower
  // result set shows an empty table and reads as "no results".
  const change = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const [editing, setEditing] = useState<Enquiry | null>(null);
  const [adding, setAdding] = useState(false);
  const [converting, setConverting] = useState<Enquiry | null>(null);
  const [deleting, setDeleting] = useState<Enquiry | null>(null);
  const remove = useDeleteEnquiry();

  const filters = {
    search,
    status,
    source,
    followUp,
    dateFrom,
    dateTo,
    branchId: showBranch ? branchId : undefined,
  };
  const enquiries = useEnquiries({ ...filters, page, pageSize: PAGE_SIZE });
  // Deliberately the same filters: the header must describe the rows below
  // it, not the whole table.
  const summary = useEnquirySummary(filters);

  const rows = enquiries.data?.results ?? [];
  const total = enquiries.data?.count ?? 0;
  const isFiltered = Boolean(
    search || status || source || followUp || dateFrom || dateTo || branchId,
  );

  const quickRange = (days: number) => {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - days);
    change(setDateFrom)(toLocalDateString(days === 0 ? today : from));
    setDateTo(toLocalDateString(today));
  };

  const stats = summary.data;

  return (
    <div className="flex flex-col gap-4">
      {stats && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm shadow-sm">
          <span className="text-text-primary">
            <span className="text-lg font-semibold">{stats.total}</span>{" "}
            <span className="text-text-secondary">
              {stats.total === 1 ? "enquiry" : "enquiries"}
            </span>
          </span>
          <span className="text-text-secondary">
            <span className="font-semibold text-success">{stats.converted}</span> enrolled
          </span>
          {stats.dueToday > 0 && (
            <span className="text-text-secondary">
              <span className="font-semibold text-text-primary">{stats.dueToday}</span> due
              today
            </span>
          )}
          {stats.overdue > 0 && (
            <span className="text-danger">
              <span className="font-semibold">{stats.overdue}</span> overdue
            </span>
          )}
          {stats.topSource && (
            <span className="text-text-secondary">
              Most from{" "}
              <span className="font-medium text-text-primary">
                {SOURCE_LABELS[stats.topSource]}
              </span>{" "}
              ({stats.topSourceCount})
            </span>
          )}
        </div>
      )}

      <FilterBar
        search={
          <SearchField
            placeholder="Caller, phone, child's name, concern…"
            value={search}
            onChange={(event) => change(setSearch)(event.target.value)}
          />
        }
        dateSlot={
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-end gap-2">
              <Input
                label="Called from"
                type="date"
                containerClassName={FILTER_FIELD_WIDTH}
                value={dateFrom}
                onChange={(event) => change(setDateFrom)(event.target.value)}
              />
              <Input
                label="to"
                type="date"
                containerClassName={FILTER_FIELD_WIDTH}
                min={dateFrom || undefined}
                value={dateTo}
                onChange={(event) => change(setDateTo)(event.target.value)}
              />
            </div>
            <div className="flex gap-1.5">
              <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => quickRange(0)}>
                Today
              </Button>
              <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => quickRange(6)}>
                This week
              </Button>
              <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => quickRange(29)}>
                This month
              </Button>
            </div>
          </div>
        }
        actions={
          canRecord ? <Button onClick={() => setAdding(true)}>Add Enquiry</Button> : undefined
        }
      >
        <Select
          label="Status"
          containerClassName={FILTER_FIELD_WIDTH}
          value={status}
          onChange={(event) => change(setStatus)(event.target.value)}
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          label="Source"
          containerClassName={FILTER_FIELD_WIDTH}
          value={source}
          onChange={(event) => change(setSource)(event.target.value)}
        >
          <option value="">All sources</option>
          {Object.entries(SOURCE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          label="Follow-up"
          containerClassName={FILTER_FIELD_WIDTH}
          value={followUp}
          onChange={(event) => change(setFollowUp)(event.target.value)}
        >
          <option value="">All</option>
          {FOLLOW_UP_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        {showBranch && (
          <BranchFilterSelect value={branchId} onChange={change(setBranchId)} />
        )}
      </FilterBar>

      {enquiries.isError ? (
        <ErrorState onRetry={() => enquiries.refetch()} />
      ) : enquiries.isLoading ? (
        <TableSkeleton rows={5} columns={showBranch ? 7 : 6} />
      ) : rows.length === 0 ? (
        <EmptyState
          label={
            isFiltered
              ? "No enquiries match these filters. Try a different name, source or date."
              : canRecord
                ? "No calls recorded yet. Press Add Enquiry when the phone rings."
                : "No calls recorded yet."
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-border bg-background/60 text-left">
                <tr className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  <th scope="col" className="px-4 py-3">Caller</th>
                  <th scope="col" className="px-4 py-3">For</th>
                  <th scope="col" className="px-4 py-3">Concern</th>
                  {showBranch && <th scope="col" className="px-4 py-3">Branch</th>}
                  <th scope="col" className="px-4 py-3">Source</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Follow-up</th>
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((enquiry) => (
                  <tr key={enquiry.id} className="align-top">
                    <td className="px-4 py-3">
                      <span className="font-medium text-text-primary">
                        {enquiry.callerName}
                      </span>
                      <span className="block text-xs text-text-secondary">
                        {enquiry.callerPhone}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-primary">
                      {enquiry.patientName || "—"}
                      {enquiry.patientAge != null && (
                        <span className="block text-xs text-text-secondary">
                          {enquiry.patientAge} yrs
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {enquiry.concern || "—"}
                    </td>
                    {showBranch && (
                      <td className="px-4 py-3 text-text-secondary">
                        {enquiry.branchName}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span className="text-text-primary">
                        {SOURCE_LABELS[enquiry.source]}
                      </span>
                      {enquiry.sourceDetail && (
                        <span className="block text-xs text-text-secondary">
                          {enquiry.sourceDetail}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={statusTone(enquiry.status)}
                        label={STATUS_LABELS[enquiry.status]}
                      />
                      {enquiry.convertedPatientCode && (
                        <span className="mt-1 block font-mono text-[10px] text-text-secondary">
                          {enquiry.convertedPatientCode}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {enquiry.followUpOverdue ? (
                        <span className="font-medium text-danger">
                          {formatDate(enquiry.followUpOn)}
                          <span className="block text-xs font-normal">Overdue</span>
                        </span>
                      ) : (
                        <span className="text-text-secondary">
                          {formatDate(enquiry.followUpOn)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ActionMenu
                        label={`Actions for ${enquiry.callerName}'s enquiry`}
                        items={[
                          {
                            key: "edit",
                            label: "Edit",
                            icon: Pencil,
                            onSelect: () => setEditing(enquiry),
                          },
                          {
                            key: "convert",
                            label: "Register as patient",
                            icon: UserPlus,
                            onSelect: () => setConverting(enquiry),
                            hidden: !canRecord,
                            disabled: Boolean(enquiry.convertedPatientId),
                            hint: enquiry.convertedPatientId
                              ? `Already registered as ${enquiry.convertedPatientCode}.`
                              : undefined,
                          },
                          {
                            key: "delete",
                            label: "Delete",
                            icon: Trash2,
                            tone: "danger",
                            onSelect: () => setDeleting(enquiry),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            count={total}
            onPageChange={setPage}
          />
        </>
      )}

      <EnquiryFormModal
        open={adding}
        enquiry={null}
        onClose={() => setAdding(false)}
      />
      <EnquiryFormModal
        open={Boolean(editing)}
        enquiry={editing}
        onClose={() => setEditing(null)}
      />
      <ConvertEnquiryModal enquiry={converting} onClose={() => setConverting(null)} />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this enquiry?"
        description={
          deleting
            ? `${deleting.callerName}'s call will stop appearing in the list. The record is kept, not destroyed.`
            : ""
        }
        confirmLabel="Delete"
        danger
        isLoading={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
        }}
      />
    </div>
  );
}
