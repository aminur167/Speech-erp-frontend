"use client";

import { Check, X as XIcon } from "lucide-react";
import { formatCurrency } from "@/utils/currency";
import { ExpenseStatusBadge } from "@/components/expenses/ExpenseStatusBadge";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { RowDetailDrawer, useRowDetail } from "@/components/ui/RowDetailDrawer";
import type { Expense } from "@/types/domain";

export function ExpenseTable({
  expenses,
  canApprove,
  onApprove,
  onReject,
  isMutating,
}: {
  expenses: Expense[];
  canApprove: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  isMutating?: boolean;
}) {
  const detail = useRowDetail<Expense>();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="py-2 pr-4 font-medium">Expense ID</th>
            <th className="py-2 pr-4 font-medium">Date</th>
            <th className="py-2 pr-4 font-medium">Category</th>
            <th className="py-2 pr-4 font-medium">Description</th>
            <th className="py-2 pr-4 font-medium">Paid To</th>
            <th className="py-2 pr-4 font-medium">Amount</th>
            <th className="py-2 pr-4 font-medium">Notes</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            {canApprove && <th className="w-12 py-2 pr-2 font-medium"><span className="sr-only">Actions</span></th>}
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id} {...detail.rowProps(expense)}>
              <td className="py-2 pr-4 font-mono text-xs text-text-secondary">
                {expense.expenseCode}
              </td>
              <td className="whitespace-nowrap py-2 pr-4">
                {new Date(expense.createdAt).toLocaleDateString()}
              </td>
              <td className="py-2 pr-4 capitalize">{expense.category}</td>
              <td className="py-2 pr-4">{expense.description}</td>
              <td className="py-2 pr-4 text-text-secondary">{expense.paidTo}</td>
              <td className="py-2 pr-4 font-medium">{formatCurrency(expense.amount)}</td>
              <td className="max-w-[220px] py-2 pr-4">
                {expense.remarks && (
                  <p className="truncate text-text-secondary" title={expense.remarks}>
                    {expense.remarks}
                  </p>
                )}
                {expense.reviewNote && (
                  <p
                    className={
                      expense.status === "rejected"
                        ? "truncate text-danger"
                        : "truncate text-text-secondary"
                    }
                    title={expense.reviewNote}
                  >
                    {expense.reviewedBy ? `${expense.reviewedBy}: ` : ""}
                    {expense.reviewNote}
                  </p>
                )}
                {!expense.remarks && !expense.reviewNote && (
                  <span className="text-xs text-text-secondary">—</span>
                )}
              </td>
              <td className="py-2 pr-4">
                <ExpenseStatusBadge status={expense.status} />
              </td>
              {canApprove && (
                <td className="py-2 pr-2 text-right">
                  {expense.status === "pending" ? (
                    <ActionMenu
                      label={`Actions for ${expense.expenseCode}`}
                      items={[
                        {
                          key: "approve",
                          label: "Approve",
                          icon: Check,
                          disabled: isMutating,
                          onSelect: () => onApprove?.(expense.id),
                        },
                        {
                          key: "reject",
                          label: "Reject",
                          icon: XIcon,
                          tone: "danger",
                          disabled: isMutating,
                          onSelect: () => onReject?.(expense.id),
                        },
                      ]}
                    />
                  ) : (
                    <span className="text-xs text-text-secondary">—</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <RowDetailDrawer
        open={detail.isOpen}
        onClose={detail.close}
        title={detail.selected?.expenseCode ?? ""}
        subtitle={detail.selected?.description ?? undefined}
        data={detail.selected}
      />
    </div>
  );
}
