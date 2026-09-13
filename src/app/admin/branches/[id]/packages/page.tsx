import { ServiceCatalogView } from "@/components/services/ServiceCatalogView";

export default async function AdminBranchPackagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ServiceCatalogView
      title="Packages"
      addLabel="Add Package"
      canManage
      branchId={id}
    />
  );
}
