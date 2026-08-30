"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  RefreshCw,
  Download,
  Clock,
  CalendarDays,
  Layers,
  Globe,
  Pencil,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { clsx } from "clsx";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { StatCard } from "@/components/dashboard/StatCard";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ServiceForm } from "@/components/services/ServiceForm";
import { AddPackageModal } from "@/components/services/AddPackageModal";
import { useServices } from "@/hooks/services/useServices";
import { useServiceEnrollmentCounts } from "@/hooks/services/useServiceEnrollmentCounts";
import { useCreateService } from "@/hooks/services/useCreateService";
import { useUpdateService } from "@/hooks/services/useUpdateService";
import { useDeleteService } from "@/hooks/services/useDeleteService";
import { exportToCsv } from "@/utils/exportCsv";
import type { Service, ServiceCategory } from "@/types/domain";
import type { ServiceInput } from "@/lib/api/services";

const CATEGORY_META: Record<ServiceCategory, { label: string; icon: LucideIcon }> = {
  daily: { label: "Daily", icon: Clock },
  monthly: { label: "Monthly", icon: CalendarDays },
  installment: { label: "Installment", icon: Layers },
  online: { label: "Online", icon: Globe },
};

const SECTION_LABELS: Record<ServiceCategory, string> = {
  daily: "Daily Services",
  monthly: "Monthly Services",
  installment: "Installment Services",
  online: "Online Services",
};

const CATEGORY_ORDER: ServiceCategory[] = ["daily", "monthly", "installment", "online"];

export function ServiceCatalogView({
  homeHref,
  roleLabel,
  title,
  subtitle,
  addLabel,
  canManage,
}: {
  homeHref: string;
  roleLabel: string;
  title: string;
  subtitle: string;
  addLabel: string;
  canManage: boolean;
}) {
  const { data: services, isLoading, isFetching, refetch } = useServices();
  const { data: enrollmentCounts } = useServiceEnrollmentCounts();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | "">("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);

  const categoryCounts = useMemo(() => {
    const counts: Record<ServiceCategory, number> = { daily: 0, monthly: 0, installment: 0, online: 0 };
    services?.forEach((service) => {
      counts[service.category] += 1;
    });
    return counts;
  }, [services]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (services ?? []).filter((service) => {
      if (categoryFilter && service.category !== categoryFilter) return false;
      if (!query) return true;
      return (
        service.name.toLowerCase().includes(query) || service.code.toLowerCase().includes(query)
      );
    });
  }, [services, search, categoryFilter]);

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, Service[]>>((acc, service) => {
      (acc[service.category] ??= []).push(service);
      return acc;
    }, {});
  }, [filtered]);

  const hasFilters = Boolean(search || categoryFilter);

  const handleCreate = (input: ServiceInput) => {
    createService.mutate(input, { onSuccess: () => setIsAddOpen(false) });
  };

  const handleUpdate = (input: ServiceInput) => {
    if (!editingService) return;
    updateService.mutate(
      { id: editingService.id, input },
      { onSuccess: () => setEditingService(null) },
    );
  };

  const handleDelete = () => {
    if (!deletingService) return;
    deleteService.mutate(deletingService.id, { onSuccess: () => setDeletingService(null) });
  };

  const handleExport = () => {
    exportToCsv(
      "packages.csv",
      filtered.map((service) => ({
        Code: service.code,
        Name: service.name,
        Category: service.category,
        Fee: service.fee,
        "Original Fee": service.originalFee ?? "",
        Duration: service.durationLabel ?? "",
        Sessions: service.sessionsLabel ?? "",
        Expiry: service.expiryLabel ?? "",
        Delivery: service.isOnline ? "Online" : "In-clinic",
        Description: service.description ?? "",
      })),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref={homeHref}
        breadcrumb={[roleLabel, title]}
        title={title}
        subtitle={subtitle}
        action={
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4" />
            {addLabel}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORY_ORDER.map((category) => (
          <StatCard
            key={category}
            label={`${CATEGORY_META[category].label} Packages`}
            value={String(categoryCounts[category])}
            icon={CATEGORY_META[category].icon}
            selected={categoryFilter === category}
            onClick={() => setCategoryFilter((prev) => (prev === category ? "" : category))}
          />
        ))}
      </div>

      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[220px] flex-1">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search package name or code…"
              />
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("");
                }}
                className="text-sm font-medium text-primary hover:underline"
              >
                Reset
              </button>
            )}
            <div className="ml-auto flex gap-2">
              <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={clsx("h-4 w-4", isFetching && "animate-spin")} />
                Refresh
              </Button>
              <Button variant="secondary" onClick={handleExport} disabled={filtered.length === 0}>
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {isLoading && <LoadingState label="Loading packages…" />}
          {!isLoading && filtered.length === 0 && <EmptyState label="No packages found." />}
        </div>
      </Card>

      {!isLoading &&
        CATEGORY_ORDER.map((category) =>
          grouped[category]?.length ? (
            <div key={category} className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-text-secondary">
                {SECTION_LABELS[category]}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {grouped[category].map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    enrolledCount={enrollmentCounts?.[service.id]}
                    actions={
                      canManage ? (
                        <>
                          <Button
                            variant="secondary"
                            className="flex-1"
                            onClick={() => setEditingService(service)}
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
                      ) : undefined
                    }
                  />
                ))}
              </div>
            </div>
          ) : null,
        )}

      <AddPackageModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={createService.isPending}
      />

      {canManage && (
        <>
          <Modal
            open={Boolean(editingService)}
            onClose={() => setEditingService(null)}
            title="Edit Package"
            description="Package details are shown across enrollment flows and the catalog."
          >
            {editingService && (
              <ServiceForm
                initialValues={editingService}
                onSubmit={handleUpdate}
                onCancel={() => setEditingService(null)}
                isSubmitting={updateService.isPending}
              />
            )}
          </Modal>
          <ConfirmDialog
            open={Boolean(deletingService)}
            onClose={() => setDeletingService(null)}
            onConfirm={handleDelete}
            title="Delete package?"
            description={`"${deletingService?.name}" will be removed from the catalog. This can't be undone.`}
            confirmLabel="Delete"
            danger
            isLoading={deleteService.isPending}
          />
        </>
      )}
    </div>
  );
}
