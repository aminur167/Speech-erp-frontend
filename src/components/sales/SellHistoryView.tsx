"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { SellHistoryTable } from "@/components/sales/SellHistoryTable";

/**
 * Admin's own Sell History page — every branch's counter in one list.
 *
 * The Manager reaches the same table from a modal on their Sell page; this
 * is a page because Admin arrives at it to look across branches rather than
 * mid-sale, and because it is a sidebar destination in its own right.
 */
export function SellHistoryView() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Sell History" />
      <SellHistoryTable showBranch />
    </div>
  );
}
