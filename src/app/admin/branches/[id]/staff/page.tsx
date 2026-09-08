import { StaffListView } from "@/components/staff/StaffListView";

export default async function AdminBranchStaffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <StaffListView
      branchId={id}
      homeHref={`/admin/branches/${id}`}
      roleLabel="Admin"
    />
  );
}
