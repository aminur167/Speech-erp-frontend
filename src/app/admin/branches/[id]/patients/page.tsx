import { PatientListView } from "@/components/patients/PatientListView";

export default async function AdminBranchPatientsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PatientListView
      basePath="/admin/patients"
      homeHref={`/admin/branches/${id}`}
      roleLabel="Admin"
      branchId={id}
    />
  );
}
