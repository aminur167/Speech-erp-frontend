"use client";

import { ServiceCatalogView } from "@/components/services/ServiceCatalogView";

export function ManagerPackagesView() {
  return (
    <ServiceCatalogView
      homeHref="/manager/dashboard"
      roleLabel="Branch Manager"
      title="Packages"
      subtitle="Browse the service catalog available for enrollment. Only Admin can add or edit packages."
      addLabel="Add Package"
      canManage={false}
    />
  );
}
