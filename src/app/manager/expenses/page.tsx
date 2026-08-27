import { ExpenseListView } from "@/components/expenses/ExpenseListView";

export default function ManagerExpensesPage() {
  return <ExpenseListView homeHref="/manager/dashboard" roleLabel="Branch Manager" />;
}
