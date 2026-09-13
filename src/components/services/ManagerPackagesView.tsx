"use client";

import { ServiceCatalogView } from "@/components/services/ServiceCatalogView";

export function ManagerPackagesView() {
  return (
    <ServiceCatalogView
      title="Packages"
      addLabel="Propose Package"
      canManage={false}
    />
  );
}
