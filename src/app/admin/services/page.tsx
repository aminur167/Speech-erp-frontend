"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { ServiceCard } from "@/components/services/ServiceCard";
import { useServices } from "@/hooks/services/useServices";
import type { ServiceCategory } from "@/types/domain";

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  daily: "Daily Services",
  monthly: "Monthly Services",
  installment: "Installment Services",
  online: "Online Services",
};

export default function AdminServicesPage() {
  const { data: services, isLoading } = useServices();

  const grouped = services?.reduce<Record<string, typeof services>>((acc, service) => {
    (acc[service.category] ??= []).push(service);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref="/admin/dashboard"
        breadcrumb={["Admin", "Services"]}
        title="Services"
        subtitle="The service catalog offered across all branches."
      />

      {isLoading && (
        <Card>
          <LoadingState label="Loading services…" />
        </Card>
      )}

      {!isLoading && (!services || services.length === 0) && (
        <Card>
          <EmptyState label="No services configured yet." />
        </Card>
      )}

      {!isLoading &&
        grouped &&
        (Object.keys(CATEGORY_LABELS) as ServiceCategory[]).map((category) =>
          grouped[category]?.length ? (
            <div key={category} className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-text-secondary">
                {CATEGORY_LABELS[category]}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {grouped[category].map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </div>
          ) : null,
        )}
    </div>
  );
}
