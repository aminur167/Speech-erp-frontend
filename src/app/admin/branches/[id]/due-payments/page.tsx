import { DuePaymentCollectionView } from "@/components/duePayments/DuePaymentCollectionView";

export default async function AdminBranchDuePaymentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <DuePaymentCollectionView
      branchId={id}
      homeHref={`/admin/branches/${id}`}
      roleLabel="Admin"
      readOnly
    />
  );
}
