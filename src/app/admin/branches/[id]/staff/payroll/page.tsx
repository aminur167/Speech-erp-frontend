import { StaffPayrollView } from "@/components/staff/StaffPayrollView";

export default async function AdminBranchStaffPayrollPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <StaffPayrollView
      branchId={id}
      basePath={`/admin/branches/${id}/staff`}
      roleLabel="Admin"
    />
  );
}
