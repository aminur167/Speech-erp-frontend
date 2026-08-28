import { TransactionHistoryView } from "@/components/transactions/TransactionHistoryView";

export default async function AdminBranchTransactionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <TransactionHistoryView homeHref={`/admin/branches/${id}`} roleLabel="Admin" branchId={id} />
  );
}
