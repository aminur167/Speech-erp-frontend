import { ExpenseListView } from "@/components/expenses/ExpenseListView";

export default async function AdminBranchExpensesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ExpenseListView homeHref={`/admin/branches/${id}`} roleLabel="Admin" branchId={id} />
  );
}
