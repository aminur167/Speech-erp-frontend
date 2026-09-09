"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { FilterBar, FILTER_FIELD_WIDTH } from "@/components/ui/FilterBar";
import { PageHeader } from "@/components/layout/PageHeader";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { ExpenseTable } from "@/components/expenses/ExpenseTable";
import { DuePaymentTable } from "@/components/duePayments/DuePaymentTable";
import { DailyLedgerTable } from "@/components/reports/summary/DailyLedgerTable";
import { RefundLedgerTable } from "@/components/reports/summary/RefundLedgerTable";
import { ClosingLedgerTable } from "@/components/reports/summary/ClosingLedgerTable";
import { BreakdownTable } from "@/components/reports/summary/BreakdownTable";
import { useBranchSummary } from "@/hooks/reports/useBranchSummary";
import { useBranchDailyLedger } from "@/hooks/reports/useBranchDailyLedger";
import { useTransactions } from "@/hooks/transactions/useTransactions";
import { useExpenses } from "@/hooks/expenses/useExpenses";
import { useRefundRequests } from "@/hooks/payments/useRefundRequests";
import { useDailyClosings } from "@/hooks/dailyClosing/useDailyClosings";
import { useDuePayments } from "@/hooks/duePayments/useDuePayments";
import { exportToCsv } from "@/utils/exportCsv";
import { formatCurrency } from "@/utils/currency";
import { toLocalDateString } from "@/utils/time";
import type {
  DailyClosingStatus,
  ExpenseCategory,
  ExpenseStatus,
  PaymentMethod,
  PaymentStatus,
  RefundRequestStatus,
} from "@/types/domain";
import type { DuePaymentType } from "@/lib/api/duePayments";

const PAGE_SIZE = 10;

const isoDate = toLocalDateString;

function firstOfThisMonth(): string {
  const now = new Date();
  return isoDate(new Date(now.getFullYear(), now.getMonth(), 1));
}

type Preset = "today" | "month" | "last30" | "year" | "custom";

function presetRange(preset: Exclude<Preset, "custom">): [string, string] {
  const now = new Date();
  const today = isoDate(now);
  switch (preset) {
    case "today":
      return [today, today];
    case "month":
      return [firstOfThisMonth(), today];
    case "last30": {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      return [isoDate(from), today];
    }
    case "year":
      return [isoDate(new Date(now.getFullYear(), 0, 1)), today];
  }
}

/**
 * Every dataset the page can show. Each is a table of its own records rather
 * than a rolled-up figure: a number on a card can only be believed, whereas a
 * table can be read, checked line by line and exported — which is what a
 * branch actually needs when a total looks wrong.
 *
 * `ranged: false` marks the one dataset the date range deliberately does not
 * apply to. Money still owed is a position as of now, not something that
 * happened inside a window, and filtering it by one would quietly answer a
 * different question than the tab asks.
 */
const TABS = [
  { key: "daily", label: "Daily Ledger", ranged: true, columns: 8 },
  { key: "invoices", label: "Invoices", ranged: true, columns: 6 },
  { key: "expenses", label: "Expenses", ranged: true, columns: 8 },
  { key: "refunds", label: "Refunds", ranged: true, columns: 7 },
  { key: "closings", label: "Daily Closing", ranged: true, columns: 6 },
  { key: "dues", label: "Outstanding Dues", ranged: false, columns: 6 },
  { key: "methods", label: "By Payment Method", ranged: true, columns: 3 },
  { key: "services", label: "By Service Type", ranged: true, columns: 3 },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/**
 * One branch's full record over a chosen date range, as tables.
 *
 * Shared by the Manager's own Summary page and Admin's branch drill-down —
 * `branchId` is what distinguishes them, and the backend ignores it for a
 * Manager, so the same screen can't leak another branch either way.
 */
export function BranchSummaryView({
  homeHref,
  breadcrumb,
  branchId,
  subtitle,
}: {
  homeHref: string;
  breadcrumb: string[];
  /** Admin only — a Manager is scoped to their own branch server-side. */
  branchId?: string;
  subtitle: string;
}) {
  const [tab, setTab] = useState<TabKey>("daily");
  const [dateFrom, setDateFrom] = useState(firstOfThisMonth);
  const [dateTo, setDateTo] = useState(() => isoDate(new Date()));
  const [preset, setPreset] = useState<Preset>("month");
  const [page, setPage] = useState(1);

  // Each tab keeps its own filters, so switching away and back doesn't lose
  // what you had narrowed to — and a status meant for expenses can never end
  // up applied to refunds.
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | "">("");
  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory | "">("");
  const [expenseStatus, setExpenseStatus] = useState<ExpenseStatus | "">("");
  const [refundStatus, setRefundStatus] = useState<RefundRequestStatus | "">("");
  const [closingStatus, setClosingStatus] = useState<DailyClosingStatus | "">("");
  const [dueSearch, setDueSearch] = useState("");
  const [dueType, setDueType] = useState<DuePaymentType | "">("");

  const rangeIsValid = dateFrom <= dateTo;
  const range = { dateFrom, dateTo };
  // Only the tab on screen fetches. A reversed range is the user's typo
  // rather than a query, so nothing fetches for one either.
  const on = (key: TabKey) => ({ enabled: rangeIsValid && tab === key });

  const changeTab = (next: TabKey) => {
    setTab(next);
    setPage(1);
  };

  /** Any filter change restarts paging — page 4 of a different result set is meaningless. */
  const filtering =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  const applyPreset = (next: Preset) => {
    setPreset(next);
    if (next === "custom") return;
    const [from, to] = presetRange(next);
    setDateFrom(from);
    setDateTo(to);
    setPage(1);
  };

  const setRangeEnd = (which: "from" | "to", value: string) => {
    // Typing a date by hand means the range is no longer whichever preset
    // last set it, and leaving that label selected would misdescribe it.
    setPreset("custom");
    setPage(1);
    if (which === "from") setDateFrom(value);
    else setDateTo(value);
  };

  const ledger = useBranchDailyLedger({ branchId, ...range }, on("daily"));
  const summary = useBranchSummary(
    { branchId, ...range },
    { enabled: rangeIsValid && (tab === "methods" || tab === "services") },
  );
  const invoices = useTransactions(
    {
      branchId, ...range, page, pageSize: PAGE_SIZE,
      search: search || undefined,
      method: method || undefined,
      status: paymentStatus || undefined,
    },
    on("invoices"),
  );
  const expenses = useExpenses(
    {
      branchId, ...range, page, pageSize: PAGE_SIZE,
      search: expenseSearch || undefined,
      category: expenseCategory || undefined,
      status: expenseStatus || undefined,
    },
    on("expenses"),
  );
  const refunds = useRefundRequests(
    { branchId, ...range, page, pageSize: PAGE_SIZE, status: refundStatus || undefined },
    on("refunds"),
  );
  const closings = useDailyClosings(
    { branchId, ...range, page, pageSize: PAGE_SIZE, status: closingStatus || undefined },
    on("closings"),
  );
  const dues = useDuePayments(
    {
      branchId, page, pageSize: PAGE_SIZE,
      search: dueSearch || undefined,
      type: dueType || undefined,
    },
    on("dues"),
  );

  // The ledger and the two breakdowns come back whole rather than paginated,
  // so their paging happens here.
  const ledgerRows = useMemo(() => ledger.data ?? [], [ledger.data]);
  const ledgerPage = ledgerRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const methodRows = summary.data?.byMethod ?? [];
  const categoryRows = summary.data?.byCategory ?? [];

  const active = TABS.find((entry) => entry.key === tab)!;

  const query = {
    daily: ledger,
    invoices,
    expenses,
    refunds,
    closings,
    dues,
    methods: summary,
    services: summary,
  }[tab];

  const count = {
    daily: ledgerRows.length,
    invoices: invoices.data?.count ?? 0,
    expenses: expenses.data?.count ?? 0,
    refunds: refunds.data?.count ?? 0,
    closings: closings.data?.count ?? 0,
    dues: dues.data?.count ?? 0,
    methods: methodRows.length,
    services: categoryRows.length,
  }[tab];

  /**
   * Exports what is on screen for the current tab.
   *
   * The row shapes are spelled out per tab rather than dumping the raw
   * objects: a CSV is opened in a spreadsheet by someone who never sees this
   * code, and "patientCode" in a header cell helps nobody.
   */
  const handleExport = () => {
    const filename = `${active.key}-${dateFrom}-to-${dateTo}.csv`;

    if (tab === "daily") {
      exportToCsv(
        filename,
        ledgerRows.map((row) => ({
          Date: row.date,
          Invoices: row.transactionCount,
          Patients: row.patientsSeen,
          Collected: row.collected,
          Refunds: row.refunded,
          Expenses: row.expenses,
          Net: row.netRevenue,
          Closing: row.closingStatus || "not closed",
        })),
      );
      return;
    }
    if (tab === "invoices") {
      exportToCsv(
        filename,
        (invoices.data?.results ?? []).map((row) => ({
          "Receipt No": row.receiptNumber,
          Date: new Date(row.createdAt).toLocaleString(),
          Patient: row.patientName,
          "Patient ID": row.patientCode,
          Method: row.method,
          Status: row.status,
          Amount: row.amount,
          "Collected By": row.collectedBy,
        })),
      );
      return;
    }
    if (tab === "expenses") {
      exportToCsv(
        filename,
        (expenses.data?.results ?? []).map((row) => ({
          Voucher: row.expenseCode,
          Date: new Date(row.createdAt).toLocaleDateString(),
          Category: row.category,
          Description: row.description,
          "Paid To": row.paidTo,
          Status: row.status,
          Amount: row.amount,
        })),
      );
      return;
    }
    if (tab === "refunds") {
      exportToCsv(
        filename,
        (refunds.data?.results ?? []).map((row) => ({
          "Receipt No": row.payment.receiptNumber,
          Requested: new Date(row.requestedAt).toLocaleDateString(),
          Reason: row.reason,
          "Requested By": row.requestedBy,
          Status: row.status,
          Amount: row.amount,
        })),
      );
      return;
    }
    if (tab === "closings") {
      exportToCsv(
        filename,
        (closings.data?.results ?? []).map((row) => ({
          Date: row.date,
          "System Total": row.systemTotal,
          Counted: row.actualTotal,
          Difference: row.difference,
          Status: row.status,
          "Submitted By": row.submittedBy,
        })),
      );
      return;
    }
    if (tab === "dues") {
      exportToCsv(
        `dues-as-of-${isoDate(new Date())}.csv`,
        (dues.data?.results ?? []).map((row) => ({
          Patient: row.patientName,
          "Patient ID": row.patientCode,
          Type: row.type,
          Service: row.serviceName,
          "Due Date": row.dueDate,
          Status: row.status,
          "Payable Now": row.amount,
          "Total Outstanding": row.outstandingTotal,
        })),
      );
      return;
    }

    const breakdown = tab === "methods" ? methodRows : categoryRows;
    const heading = tab === "methods" ? "Method" : "Service Type";
    exportToCsv(
      filename,
      breakdown.map((row) => ({ [heading]: row.label, Amount: row.amount })),
    );
  };

  const today = isoDate(new Date());
  const isEmpty = count === 0;
  const duesOnThisPage = (dues.data?.results ?? []).reduce(
    (running, row) => running + row.outstandingTotal,
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref={homeHref}
        breadcrumb={breadcrumb}
        title="Summary"
        subtitle={subtitle}
      />

      <div className="sticky top-0 z-20 -mx-4 bg-background/80 px-4 py-1 backdrop-blur md:-mx-8 md:px-8">
      <FilterBar
        dateSlot={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={preset}
              aria-label="Date range preset"
              onChange={(event) => applyPreset(event.target.value as Preset)}
              containerClassName={FILTER_FIELD_WIDTH}
            >
              <option value="today">Today</option>
              <option value="month">This month</option>
              <option value="last30">Last 30 days</option>
              <option value="year">This year</option>
              <option value="custom">Custom</option>
            </Select>
            <Input
              type="date"
              aria-label="From date"
              value={dateFrom}
              max={today}
              onChange={(event) => setRangeEnd("from", event.target.value)}
              containerClassName={FILTER_FIELD_WIDTH}
            />
            <span className="text-xs text-text-secondary">to</span>
            <Input
              type="date"
              aria-label="To date"
              value={dateTo}
              max={today}
              onChange={(event) => setRangeEnd("to", event.target.value)}
              containerClassName={FILTER_FIELD_WIDTH}
            />
          </div>
        }
      >
        {tab === "invoices" && (
          <>
            <Input
              value={search}
              onChange={(event) => filtering(setSearch)(event.target.value)}
              placeholder="Patient, receipt or transaction ID…"
              containerClassName="w-full sm:w-56 shrink-0"
            />
            <Select
              value={method}
              aria-label="Payment method"
              onChange={(event) =>
                filtering(setMethod)(event.target.value as PaymentMethod | "")
              }
              containerClassName={FILTER_FIELD_WIDTH}
            >
              <option value="">All methods</option>
              <option value="cash">Cash</option>
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
              <option value="rocket">Rocket</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="online_payment">Online Payment</option>
              <option value="card">Card</option>
            </Select>
            <Select
              value={paymentStatus}
              aria-label="Invoice status"
              onChange={(event) =>
                filtering(setPaymentStatus)(event.target.value as PaymentStatus | "")
              }
              containerClassName={FILTER_FIELD_WIDTH}
            >
              <option value="">All statuses</option>
              <option value="paid">Paid</option>
              <option value="due">Due</option>
              <option value="refunded">Refunded</option>
              <option value="void">Void</option>
            </Select>
          </>
        )}

        {tab === "expenses" && (
          <>
            <Input
              value={expenseSearch}
              onChange={(event) => filtering(setExpenseSearch)(event.target.value)}
              placeholder="Voucher, description or payee…"
              containerClassName="w-full sm:w-56 shrink-0"
            />
            <Select
              value={expenseCategory}
              aria-label="Expense category"
              onChange={(event) =>
                filtering(setExpenseCategory)(event.target.value as ExpenseCategory | "")
              }
              containerClassName={FILTER_FIELD_WIDTH}
            >
              <option value="">All categories</option>
              <option value="rent">Rent</option>
              <option value="utilities">Utilities</option>
              <option value="salaries">Salaries</option>
              <option value="supplies">Supplies</option>
              <option value="equipment">Equipment</option>
              <option value="maintenance">Maintenance</option>
              <option value="marketing">Marketing</option>
              <option value="other">Other</option>
            </Select>
            <Select
              value={expenseStatus}
              aria-label="Expense status"
              onChange={(event) =>
                filtering(setExpenseStatus)(event.target.value as ExpenseStatus | "")
              }
              containerClassName={FILTER_FIELD_WIDTH}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Select>
          </>
        )}

        {tab === "refunds" && (
          <Select
            value={refundStatus}
            aria-label="Refund status"
            onChange={(event) =>
              filtering(setRefundStatus)(event.target.value as RefundRequestStatus | "")
            }
            containerClassName={FILTER_FIELD_WIDTH}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
        )}

        {tab === "closings" && (
          <Select
            value={closingStatus}
            aria-label="Closing status"
            onChange={(event) =>
              filtering(setClosingStatus)(event.target.value as DailyClosingStatus | "")
            }
            containerClassName={FILTER_FIELD_WIDTH}
          >
            <option value="">All statuses</option>
            <option value="matched">Matched</option>
            <option value="over">Over</option>
            <option value="short">Short</option>
          </Select>
        )}

        {tab === "dues" && (
          <>
            <Input
              value={dueSearch}
              onChange={(event) => filtering(setDueSearch)(event.target.value)}
              placeholder="Patient name or ID…"
              containerClassName="w-full sm:w-56 shrink-0"
            />
            <Select
              value={dueType}
              aria-label="Due type"
              onChange={(event) =>
                filtering(setDueType)(event.target.value as DuePaymentType | "")
              }
              containerClassName={FILTER_FIELD_WIDTH}
            >
              <option value="">All types</option>
              <option value="monthly">Monthly</option>
              <option value="installment">Installment</option>
            </Select>
          </>
        )}

        {(tab === "daily" || tab === "methods" || tab === "services") && (
          <span className="text-xs text-text-secondary">
            Filtered by date range only.
          </span>
        )}
      </FilterBar>
      </div>

      {/* Scrolls rather than wraps: eight datasets wrapping onto three rows
          on a laptop pushes the table itself below the fold, and the row of
          tabs is meant to be glanceable, not a paragraph. */}
      <div
        role="tablist"
        aria-label="Summary datasets"
        className="-mx-1 flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1 shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TABS.map((entry) => (
          <button
            key={entry.key}
            type="button"
            role="tab"
            id={`summary-tab-${entry.key}`}
            aria-selected={tab === entry.key}
            aria-controls="summary-panel"
            onClick={() => changeTab(entry.key)}
            className={clsx(
              "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              tab === entry.key
                ? "bg-primary text-white shadow-sm"
                : "text-text-secondary hover:bg-primary-light/50 hover:text-text-primary",
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {!rangeIsValid && (
        <Card>
          <p className="text-sm text-danger">
            The start date is after the end date — pick a range that runs forwards.
          </p>
        </Card>
      )}

      {rangeIsValid && (
        <Card>
          <div
            role="tabpanel"
            id="summary-panel"
            aria-labelledby={`summary-tab-${tab}`}
            tabIndex={-1}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-semibold text-text-primary">{active.label}</h2>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary">
                  <span className="rounded-full bg-background px-2 py-0.5 font-medium">
                    {active.ranged ? `${dateFrom} → ${dateTo}` : "As of today"}
                  </span>
                  <span>
                    {count} {count === 1 ? "row" : "rows"}
                  </span>
                  {/* Says plainly when the page is a window onto something
                      larger, so a total read off the screen is never mistaken
                      for the total of the range. */}
                  {count > PAGE_SIZE && (
                    <span>
                      &middot; showing {Math.min(PAGE_SIZE, count - (page - 1) * PAGE_SIZE)} on
                      this page
                    </span>
                  )}
                </div>
              </div>
              <Button variant="secondary" onClick={handleExport} disabled={isEmpty}>
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>

            {query.isLoading && <TableSkeleton columns={active.columns} />}
            {query.isError && <ErrorState onRetry={() => query.refetch()} />}
            {!query.isLoading && !query.isError && isEmpty && (
              <EmptyState label={`Nothing to show for ${active.label.toLowerCase()}.`} />
            )}

            {!query.isLoading && !query.isError && !isEmpty && (
              <>
                {tab === "daily" && (
                  <DailyLedgerTable rows={ledgerPage} totalsFor={ledgerRows} />
                )}
                {tab === "invoices" && (
                  <TransactionTable transactions={invoices.data?.results ?? []} />
                )}
                {tab === "expenses" && (
                  <ExpenseTable expenses={expenses.data?.results ?? []} canApprove={false} />
                )}
                {tab === "refunds" && (
                  <RefundLedgerTable refunds={refunds.data?.results ?? []} />
                )}
                {tab === "closings" && (
                  <ClosingLedgerTable closings={closings.data?.results ?? []} />
                )}
                {tab === "dues" && (
                  <>
                    <DuePaymentTable items={dues.data?.results ?? []} />
                    <p className="text-xs text-text-secondary">
                      Outstanding due is a position as of today, so the date range does
                      not apply here. {formatCurrency(duesOnThisPage)} on this page.
                    </p>
                  </>
                )}
                {tab === "methods" && <BreakdownTable rows={methodRows} label="Method" />}
                {tab === "services" && (
                  <BreakdownTable rows={categoryRows} label="Service Type" />
                )}

                {tab !== "methods" && tab !== "services" && (
                  <Pagination
                    page={page}
                    pageSize={PAGE_SIZE}
                    count={count}
                    onPageChange={setPage}
                  />
                )}
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
