"use client";

import { ServiceCatalogView } from "@/components/services/ServiceCatalogView";

export function AdminServicesView() {
  return (
    <ServiceCatalogView
      title="Services"
      addLabel="Add Package"
      canManage
    />
  );
}
