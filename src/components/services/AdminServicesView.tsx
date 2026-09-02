"use client";

import { ServiceCatalogView } from "@/components/services/ServiceCatalogView";

export function AdminServicesView() {
  return (
    <ServiceCatalogView
      homeHref="/admin/dashboard"
      roleLabel="Admin"
      title="Services"
      subtitle="Every branch's packages, in one place. Open a branch to add or manage its own."
      addLabel="Add Package"
      canManage
    />
  );
}
