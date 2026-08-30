import { formatCurrency } from "@/utils/currency";
import { ExpenseStatusBadge } from "@/components/expenses/ExpenseStatusBadge";
import { Button } from "@/components/ui/Button";
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
            {canApprove && <th className="py-2 pr-4 font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id} className="border-b border-border last:border-0">
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
                <td className="py-2 pr-4">
                  {expense.status === "pending" ? (
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        disabled={isMutating}
                        onClick={() => onApprove?.(expense.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        disabled={isMutating}
                        onClick={() => onReject?.(expense.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-text-secondary">—</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
