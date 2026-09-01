"use client";

import { ServiceCatalogView } from "@/components/services/ServiceCatalogView";

export function ManagerPackagesView() {
  return (
    <ServiceCatalogView
      homeHref="/manager/dashboard"
      roleLabel="Branch Manager"
      title="Packages"
      subtitle="Browse the service catalog, or propose a new package for Admin to review."
      addLabel="Propose Package"
      canManage={false}
    />
  );
}
