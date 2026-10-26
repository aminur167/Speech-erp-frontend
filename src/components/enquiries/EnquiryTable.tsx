"use client";

import { useState } from "react";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FilterBar } from "@/components/ui/FilterBar";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { SearchField } from "@/components/ui/SearchField";
import { Select } from "@/components/ui/Select";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { EnquiryFormModal } from "@/components/enquiries/EnquiryFormModal";
import { ConvertEnquiryModal } from "@/components/enquiries/ConvertEnquiryModal";
import {
  FOLLOW_UP_OPTIONS,
  SOURCE_LABELS,
  STATUS_LABELS,
  statusTone,
} from "@/components/enquiries/options";
import { useBranches } from "@/hooks/branches/useBranches";
import {
  useDeleteEnquiry,
  useEnquiries,
  useEnquirySummary,
} from "@/hooks/enquiries/useEnquiries";
import { useAuthStore } from "@/store/authStore";
import { toLocalDateString } from "@/utils/time";
import type { Enquiry } from "@/types/domain";

const PAGE_SIZE = 10;

/**
 * Narrower than the shared `FILTER_FIELD_WIDTH` (w-40): this page puts seven
 * controls on one row, and the default width pushes the dates onto a second
 * line on anything but a very wide screen.
 *
 * Measured rather than guessed — at these widths the row holds together from
 * about 1360px up, which covers the 1366 and 1920 screens the clinic uses.
 * Narrower than that it wraps to a second line, which is the right thing for
 * a laptop and is why the widths are capped rather than fixed.
 */
const FIELD = "w-full sm:w-28 shrink-0";
const DATE_FIELD = "w-full sm:w-32 shrink-0";

const RANGE_PRESETS: { value: string; label: string; days: number }[] = [
  { value: "today", label: "Today", days: 0 },
  { value: "week", label: "This week", days: 6 },
  { value: "month", label: "This month", days: 29 },
];

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Enquiries — the same screen for both roles.
 *
 * The Manager works it as their call list; Admin gets a Branch column and a
 * branch filter. `showBranch` is the only difference, because the server
 * already decides what each role may see — the column is presentation, not
 * access.
 *
 * It renders its own `PageHeader`, unlike the Sell History pair: the heading
 * carries the live counts, and those belong to the filter state that lives
 * here. Lifting the filters out just to keep a wrapper component would move
 * every one of them a level away from the table they narrow.
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
  const [range, setRange] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const branches = useBranches(showBranch);

  // Every filter change returns to page 1 — staying on page 4 of a narrower
  // result set shows an empty table and reads as "no results".
  const change = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const applyRange = (value: string) => {
    setRange(value);
    setPage(1);
    const preset = RANGE_PRESETS.find((one) => one.value === value);
    if (!preset) {
      setDateFrom("");
      setDateTo("");
      return;
    }
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - preset.days);
    setDateFrom(toLocalDateString(from));
    setDateTo(toLocalDateString(today));
  };

  // Typing a date by hand means the preset no longer describes the range.
  const setDateManually = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setRange("");
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
  // Deliberately the same filters: the heading must describe the rows below
  // it, not the whole table.
  const summary = useEnquirySummary(filters);

  const rows = enquiries.data?.results ?? [];
  const total = enquiries.data?.count ?? 0;
  const isFiltered = Boolean(
    search || status || source || followUp || dateFrom || dateTo || branchId,
  );

  const stats = summary.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            Enquiries
            {stats && (
              <span className="text-sm font-normal text-text-secondary">
                [
                <span className="font-medium text-text-primary">{stats.total}</span>{" "}
                {stats.total === 1 ? "enquiry" : "enquiries"}
                {" · "}
                <span className="font-medium text-success">{stats.converted}</span> enrolled
                {stats.dueToday > 0 && (
                  <>
                    {" · "}
                    <span className="font-medium text-text-primary">{stats.dueToday}</span>{" "}
                    due today
                  </>
                )}
                {stats.overdue > 0 && (
                  <>
                    {" · "}
                    <span className="font-medium text-danger">{stats.overdue}</span> overdue
                  </>
                )}
                {stats.topSource && (
                  <>
                    {" · most from "}
                    <span className="font-medium text-text-primary">
                      {SOURCE_LABELS[stats.topSource]}
                    </span>{" "}
                    ({stats.topSourceCount})
                  </>
                )}
                ]
              </span>
            )}
          </span>
        }
        action={
          canRecord ? <Button onClick={() => setAdding(true)}>Add Enquiry</Button> : undefined
        }
      />

      <FilterBar
        search={
          <SearchField
            placeholder="Caller, phone, patient's name, concern…"
            value={search}
            onChange={(event) => change(setSearch)(event.target.value)}
          />
        }
      >
        <Select
          label="Status"
          containerClassName={FIELD}
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
          containerClassName={FIELD}
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
          containerClassName={FIELD}
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
          <Select
            label="Branch"
            containerClassName={FIELD}
            value={branchId}
            onChange={(event) => change(setBranchId)(event.target.value)}
          >
            <option value="">All branches</option>
            {(branches.data ?? []).map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </Select>
        )}
        <Select
          label="Period"
          containerClassName={FIELD}
          value={range}
          onChange={(event) => applyRange(event.target.value)}
        >
          <option value="">Any time</option>
          {RANGE_PRESETS.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </Select>
        <Input
          label="Called from"
          type="date"
          containerClassName={DATE_FIELD}
          value={dateFrom}
          onChange={(event) => setDateManually(setDateFrom)(event.target.value)}
        />
        <Input
          label="to"
          type="date"
          containerClassName={DATE_FIELD}
          min={dateFrom || undefined}
          value={dateTo}
          onChange={(event) => setDateManually(setDateTo)(event.target.value)}
        />
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

      <EnquiryFormModal open={adding} enquiry={null} onClose={() => setAdding(false)} />
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
