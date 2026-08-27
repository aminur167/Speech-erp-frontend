import { TransactionHistoryView } from "@/components/transactions/TransactionHistoryView";

export default function AdminTransactionsPage() {
  return <TransactionHistoryView homeHref="/admin/dashboard" roleLabel="Admin" />;
}
