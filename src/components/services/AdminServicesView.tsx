"use client";

import { ServiceCatalogView } from "@/components/services/ServiceCatalogView";

export function AdminServicesView() {
  return (
    <ServiceCatalogView
      homeHref="/admin/dashboard"
      roleLabel="Admin"
      title="Services"
      subtitle="Manage the service catalog offered across all branches."
      addLabel="Add Package"
      canManage
    />
  );
}
