import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/utils/currency";
import type { TransactionItem } from "@/lib/api/transactions";

export function TransactionTable({ transactions }: { transactions: TransactionItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="py-2 pr-4 font-medium">Receipt No.</th>
            <th className="py-2 pr-4 font-medium">Date</th>
            <th className="py-2 pr-4 font-medium">Patient</th>
            <th className="py-2 pr-4 font-medium">Method</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 pr-4 font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="border-b border-border last:border-0">
              <td className="py-2 pr-4 font-mono text-xs text-text-secondary">
                {transaction.receiptNumber}
              </td>
              <td className="whitespace-nowrap py-2 pr-4">
                {new Date(transaction.createdAt).toLocaleString()}
              </td>
              <td className="py-2 pr-4">
                <p className="font-medium text-text-primary">{transaction.patientName}</p>
                <p className="font-mono text-xs text-text-secondary">
                  {transaction.patientCode}
                </p>
              </td>
              <td className="py-2 pr-4 capitalize">{transaction.method.replace("_", " ")}</td>
              <td className="py-2 pr-4">
                <StatusBadge status={transaction.status} />
              </td>
              <td className="py-2 pr-4 font-medium">{formatCurrency(transaction.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
