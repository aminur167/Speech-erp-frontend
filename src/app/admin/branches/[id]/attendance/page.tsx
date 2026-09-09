import { PatientAttendanceView } from "@/components/attendance/PatientAttendanceView";

export default async function AdminBranchAttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PatientAttendanceView
      branchId={id}
      homeHref={`/admin/branches/${id}`}
      roleLabel="Admin"
      readOnly
    />
  );
}
