import { StaffAttendanceView } from "@/components/staff/StaffAttendanceView";

export default async function AdminBranchStaffAttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <StaffAttendanceView branchId={id} basePath={`/admin/branches/${id}/staff`} />
  );
}
