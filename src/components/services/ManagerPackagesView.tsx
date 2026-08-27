"use client";

import { ServiceCatalogView } from "@/components/services/ServiceCatalogView";

export function ManagerPackagesView() {
  return (
    <ServiceCatalogView
      homeHref="/manager/dashboard"
      roleLabel="Branch Manager"
      title="Packages"
      subtitle="Browse the service catalog and add new packages under any service."
      addLabel="Add Package"
      canManage={false}
    />
  );
}
