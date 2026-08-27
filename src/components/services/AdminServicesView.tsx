"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ServiceForm } from "@/components/services/ServiceForm";
import { useServices } from "@/hooks/services/useServices";
import { useCreateService } from "@/hooks/services/useCreateService";
import { useUpdateService } from "@/hooks/services/useUpdateService";
import { useDeleteService } from "@/hooks/services/useDeleteService";
import type { Service, ServiceCategory } from "@/types/domain";
import type { ServiceInput } from "@/lib/api/services";

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  daily: "Daily Services",
  monthly: "Monthly Services",
  installment: "Installment Services",
  online: "Online Services",
};

export function AdminServicesView() {
  const { data: services, isLoading } = useServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);

  const grouped = services?.reduce<Record<string, Service[]>>((acc, service) => {
    (acc[service.category] ??= []).push(service);
    return acc;
  }, {});

  const openCreateForm = () => {
    setEditingService(null);
    setIsFormOpen(true);
  };

  const openEditForm = (service: Service) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  const handleSubmit = (input: ServiceInput) => {
    if (editingService) {
      updateService.mutate(
        { id: editingService.id, input },
        { onSuccess: () => setIsFormOpen(false) },
      );
    } else {
      createService.mutate(input, { onSuccess: () => setIsFormOpen(false) });
    }
  };

  const handleDelete = () => {
    if (!deletingService) return;
    deleteService.mutate(deletingService.id, { onSuccess: () => setDeletingService(null) });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref="/admin/dashboard"
        breadcrumb={["Admin", "Services"]}
        title="Services"
        subtitle="Manage the service catalog offered across all branches."
        action={
          <Button onClick={openCreateForm}>
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        }
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
                  <ServiceCard
                    key={service.id}
                    service={service}
                    actions={
                      <>
                        <Button
                          variant="secondary"
                          className="flex-1"
                          onClick={() => openEditForm(service)}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          className="flex-1"
                          onClick={() => setDeletingService(service)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </>
                    }
                  />
                ))}
              </div>
            </div>
          ) : null,
        )}

      <Modal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingService ? "Edit Service" : "Add Service"}
        description="Service details are shown across enrollment flows and the catalog."
      >
        <ServiceForm
          initialValues={editingService ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => setIsFormOpen(false)}
          isSubmitting={createService.isPending || updateService.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingService)}
        onClose={() => setDeletingService(null)}
        onConfirm={handleDelete}
        title="Delete service?"
        description={`"${deletingService?.name}" will be removed from the catalog. This can't be undone.`}
        confirmLabel="Delete"
        danger
        isLoading={deleteService.isPending}
      />
    </div>
  );
}
