import { BranchSummaryView } from "@/components/reports/BranchSummaryView";

export default async function AdminBranchSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <BranchSummaryView
      branchId={id}
    />
  );
}
