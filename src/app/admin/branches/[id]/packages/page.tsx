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
      subtitle="The shared service catalog — every branch offers the same packages."
      addLabel="Add Package"
      canManage
    />
  );
}
