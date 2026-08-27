import { TransactionHistoryView } from "@/components/transactions/TransactionHistoryView";

export default function ManagerTransactionsPage() {
  return <TransactionHistoryView homeHref="/manager/dashboard" roleLabel="Branch Manager" />;
}
