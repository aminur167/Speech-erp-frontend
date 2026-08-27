import { ExpenseListView } from "@/components/expenses/ExpenseListView";

export default function AdminExpensesPage() {
  return <ExpenseListView homeHref="/admin/dashboard" roleLabel="Admin" />;
}
