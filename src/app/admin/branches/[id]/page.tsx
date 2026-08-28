import { BranchDetailView } from "@/components/branches/BranchDetailView";

export default async function AdminBranchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BranchDetailView branchId={id} />;
}
