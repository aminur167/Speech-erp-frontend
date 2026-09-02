import { ServiceCatalogView } from "@/components/services/ServiceCatalogView";

export default async function AdminBranchPackagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ServiceCatalogView
      homeHref={`/admin/branches/${id}`}
      roleLabel="Admin"
      title="Packages"
      subtitle="This branch's package catalog."
      addLabel="Add Package"
      canManage
      branchId={id}
    />
  );
}
