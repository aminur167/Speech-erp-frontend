import { BranchSummaryView } from "@/components/reports/BranchSummaryView";

export default async function AdminBranchSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <BranchSummaryView
      homeHref={`/admin/branches/${id}`}
      breadcrumb={["Admin", "Summary"]}
      branchId={id}
      subtitle="Every invoice, expense, refund and closing this branch recorded, line by line."
    />
  );
}
