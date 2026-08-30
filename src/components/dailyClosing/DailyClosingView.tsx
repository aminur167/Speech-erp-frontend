"use client";

import { useMemo, useState } from "react";
import { Wallet, Receipt, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/layout/PageHeader";
import { useTodaySystemCollection } from "@/hooks/dailyClosing/useTodaySystemCollection";
import { useDailyClosingHistory } from "@/hooks/dailyClosing/useDailyClosingHistory";
import { useSubmitDailyClosing } from "@/hooks/dailyClosing/useSubmitDailyClosing";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/currency";
import { todayDateString } from "@/lib/api/dailyClosings";
import type { DailyClosingStatus } from "@/types/domain";

const statusTone: Record<DailyClosingStatus, "success" | "warning" | "danger"> = {
  matched: "success",
  over: "warning",
  short: "danger",
};

const statusLabel: Record<DailyClosingStatus, string> = {
  matched: "MATCHED",
  over: "OVER",
  short: "SHORT",
};

export function DailyClosingView({
  branchId: branchIdOverride,
  homeHref = "/manager/dashboard",
  roleLabel = "Branch Manager",
  readOnly = false,
}: {
  /** Scopes the view to one branch regardless of the logged-in user — used when Admin is browsing a specific branch. */
  branchId?: string;
  homeHref?: string;
  roleLabel?: string;
  /** Hides the submission form — Admin can review closings but shouldn't submit one on a branch's behalf. */
  readOnly?: boolean;
} = {}) {
  const user = useAuthStore((state) => state.user);
  const branchId = branchIdOverride ?? user?.branchId ?? "branch-1";

  const [actualTotal, setActualTotal] = useState("");

  const { data: summary, isLoading: summaryLoading } = useTodaySystemCollection(branchId);
  const { data: history, isLoading: historyLoading } = useDailyClosingHistory(branchId);
  const submitClosing = useSubmitDailyClosing();

  const todaysClosing = history?.find((closing) => closing.date === todayDateString());

  const actualValue = Number(actualTotal || 0);
  const difference = summary ? actualValue - summary.total : 0;
  const previewStatus: DailyClosingStatus =
    difference === 0 ? "matched" : difference > 0 ? "over" : "short";

  const handleSubmit = () => {
    if (!user) return;
    submitClosing.mutate({ actualTotal: actualValue });
  };

  const alreadySubmittedToday = useMemo(() => Boolean(todaysClosing), [todaysClosing]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref={homeHref}
        breadcrumb={[roleLabel, "Daily Closing"]}
        title="Daily Closing"
        subtitle={
          readOnly
            ? "Review this branch's collection and closing history."
            : "Review today's collection and submit the branch closing report."
        }
      />

      <Card>
        <h2 className="text-sm font-medium text-text-secondary">System Collection (Today)</h2>
        {summaryLoading && <LoadingState label="Loading today's collection…" />}
        {!summaryLoading && summary && (
          <div className="mt-3 flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary-light p-2 text-primary">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-text-primary">
                    {formatCurrency(summary.total)}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {summary.transactionCount} transaction{summary.transactionCount === 1 ? "" : "s"}{" "}
                    today
                  </p>
                </div>
              </div>
              <Receipt className="h-5 w-5 text-text-secondary" />
            </div>

            {summary.byMethod.length > 0 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {summary.byMethod.map((entry) => (
                  <div
                    key={entry.method}
                    className="rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <p className="capitalize text-text-secondary">
                      {entry.method.replace("_", " ")}
                    </p>
                    <p className="font-medium text-text-primary">
                      {formatCurrency(entry.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {alreadySubmittedToday && todaysClosing ? (
        <Card className="border-success/30 bg-success/5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-success" />
            <div>
              <h2 className="text-sm font-medium text-text-primary">
                Today&apos;s closing already submitted
              </h2>
              <p className="text-xs text-text-secondary">
                Submitted by {todaysClosing.submittedBy} at{" "}
                {new Date(todaysClosing.submittedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-text-secondary">System Total</dt>
              <dd className="font-medium text-text-primary">
                {formatCurrency(todaysClosing.systemTotal)}
              </dd>
            </div>
            <div>
              <dt className="text-text-secondary">Actual Total</dt>
              <dd className="font-medium text-text-primary">
                {formatCurrency(todaysClosing.actualTotal)}
              </dd>
            </div>
            <div>
              <dt className="text-text-secondary">Difference</dt>
              <dd className="font-medium text-text-primary">
                {formatCurrency(todaysClosing.difference)}
              </dd>
            </div>
            <div>
              <dt className="text-text-secondary">Status</dt>
              <dd>
                <Badge
                  tone={statusTone[todaysClosing.status]}
                  label={statusLabel[todaysClosing.status]}
                />
              </dd>
            </div>
          </dl>
        </Card>
      ) : !readOnly ? (
        <Card>
          <h2 className="text-sm font-medium text-text-secondary">Enter Actual Collection</h2>
          <div className="mt-3 flex flex-col gap-4">
            <Input
              type="number"
              step="0.01"
              placeholder="Counted cash & collection amount"
              value={actualTotal}
              onChange={(event) => setActualTotal(event.target.value)}
            />

            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-background p-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-text-secondary">System Total</p>
                <p className="font-medium text-text-primary">
                  {formatCurrency(summary?.total ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-text-secondary">Actual Total</p>
                <p className="font-medium text-text-primary">
                  {actualTotal ? formatCurrency(actualValue) : "—"}
                </p>
              </div>
              <div>
                <p className="text-text-secondary">Difference</p>
                <p
                  className={clsx(
                    "font-medium",
                    !actualTotal
                      ? "text-text-primary"
                      : difference === 0
                        ? "text-success"
                        : difference > 0
                          ? "text-warning"
                          : "text-danger",
                  )}
                >
                  {actualTotal ? formatCurrency(difference) : "—"}
                </p>
              </div>
              <div>
                <p className="text-text-secondary">Status</p>
                {actualTotal ? (
                  <Badge tone={statusTone[previewStatus]} label={statusLabel[previewStatus]} />
                ) : (
                  <span className="text-sm font-medium text-text-secondary">—</span>
                )}
              </div>
            </div>

            <div>
              <Button
                onClick={handleSubmit}
                disabled={!actualTotal}
                isLoading={submitClosing.isPending}
              >
                Submit Closing
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <EmptyState label="This branch hasn't submitted today's closing yet." />
        </Card>
      )}

      <Card>
        <h2 className="text-sm font-medium text-text-secondary">Closing History</h2>
        <div className="mt-3">
          {historyLoading && <LoadingState label="Loading history…" />}
          {!historyLoading && (!history || history.length === 0) && (
            <EmptyState label="No past closings yet." />
          )}
          {!historyLoading && history && history.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-text-secondary">
                    <th className="py-2 pr-4 font-medium">Date</th>
                    <th className="py-2 pr-4 font-medium">System Total</th>
                    <th className="py-2 pr-4 font-medium">Actual Total</th>
                    <th className="py-2 pr-4 font-medium">Difference</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((closing) => (
                    <tr key={closing.id} className="border-b border-border last:border-0">
                      <td className="py-2 pr-4">{closing.date}</td>
                      <td className="py-2 pr-4">{formatCurrency(closing.systemTotal)}</td>
                      <td className="py-2 pr-4">{formatCurrency(closing.actualTotal)}</td>
                      <td className="py-2 pr-4">{formatCurrency(closing.difference)}</td>
                      <td className="py-2 pr-4">
                        <Badge
                          tone={statusTone[closing.status]}
                          label={statusLabel[closing.status]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
