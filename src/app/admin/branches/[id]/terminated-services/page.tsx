import { TerminatedServicesView } from "@/components/terminatedServices/TerminatedServicesView";

export default async function AdminBranchTerminatedServicesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <TerminatedServicesView
      branchId={id}
      homeHref={`/admin/branches/${id}/due-payments`}
      roleLabel="Admin"
      readOnly
    />
  );
}
