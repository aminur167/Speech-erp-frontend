import { MaterialListView } from "@/components/materials/MaterialListView";

export default async function AdminBranchMaterialsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <MaterialListView branchId={id} homeHref={`/admin/branches/${id}`} roleLabel="Admin" />
  );
}
