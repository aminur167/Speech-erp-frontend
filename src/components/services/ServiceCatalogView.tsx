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
  LayoutGrid,
  Rows3,
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
import { RejectPackageModal } from "@/components/services/RejectPackageModal";
import { PackageActions } from "@/components/services/PackageActions";
import { PackageTable } from "@/components/services/PackageTable";
import { useServices } from "@/hooks/services/useServices";
import { useServiceEnrollmentCounts } from "@/hooks/services/useServiceEnrollmentCounts";
import { useCreateService } from "@/hooks/services/useCreateService";
import { useUpdateService } from "@/hooks/services/useUpdateService";
import { useDeleteService } from "@/hooks/services/useDeleteService";
import { useToggleServiceActive } from "@/hooks/services/useToggleServiceActive";
import { useReviewService } from "@/hooks/services/useReviewService";
import { exportToCsv } from "@/utils/exportCsv";
import type { Service, ServiceCategory } from "@/types/domain";
import type { ServiceInput } from "@/lib/api/services";
import type { ApiError } from "@/types/api";

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
  // includePending: Admin sees every proposal awaiting a decision; a Manager
  // sees only their own (see apps/services/views.py's get_queryset) -- either
  // way, an enrollment picker elsewhere in the app never passes this, so a
  // pending package can't be selected there regardless of who's looking.
  const { data: services, isLoading, isFetching, refetch } = useServices(
    undefined,
    canManage,
    true,
  );
  const { data: enrollmentCounts } = useServiceEnrollmentCounts();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const toggleServiceActive = useToggleServiceActive();
  const reviewService = useReviewService();

  const [view, setView] = useState<"table" | "card">("table");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | "">("");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "">("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addError, setAddError] = useState<ApiError | undefined>();
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editError, setEditError] = useState<ApiError | undefined>();
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [deleteBlocked, setDeleteBlocked] = useState<{ service: Service; message: string } | null>(
    null,
  );
  const [rejectingService, setRejectingService] = useState<Service | null>(null);

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
      if (statusFilter === "active" && !service.isActive) return false;
      if (statusFilter === "inactive" && service.isActive) return false;
      if (!query) return true;
      return (
        service.name.toLowerCase().includes(query) || service.code.toLowerCase().includes(query)
      );
    });
  }, [services, search, categoryFilter, statusFilter]);

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, Service[]>>((acc, service) => {
      (acc[service.category] ??= []).push(service);
      return acc;
    }, {});
  }, [filtered]);

  const hasFilters = Boolean(search || categoryFilter || statusFilter);

  const handleCreate = (input: ServiceInput) => {
    setAddError(undefined);
    createService.mutate(input, {
      onSuccess: () => setIsAddOpen(false),
      onError: (error: ApiError) => setAddError(error),
    });
  };

  const handleUpdate = (input: ServiceInput) => {
    if (!editingService) return;
    setEditError(undefined);
    updateService.mutate(
      { id: editingService.id, input },
      {
        onSuccess: () => setEditingService(null),
        onError: (error: ApiError) => setEditError(error),
      },
    );
  };

  const handleDelete = () => {
    if (!deletingService) return;
    const service = deletingService;
    deleteService.mutate(service.id, {
      onSuccess: () => setDeletingService(null),
      onError: (error: ApiError) => {
        setDeletingService(null);
        if (error.status === 400) {
          setDeleteBlocked({ service, message: error.message });
        }
      },
    });
  };

  const handleApprove = (service: Service) => {
    reviewService.mutate({ id: service.id, approve: true });
  };

  const handleDeactivateInstead = () => {
    if (!deleteBlocked) return;
    toggleServiceActive.mutate(
      { id: deleteBlocked.service.id, makeActive: false },
      { onSuccess: () => setDeleteBlocked(null) },
    );
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
            {canManage && (
              <div className="flex gap-1 rounded-lg border border-border p-1">
                {(["", "active", "inactive"] as const).map((status) => (
                  <button
                    key={status || "all"}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={clsx(
                      "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                      statusFilter === status
                        ? "bg-primary text-white"
                        : "text-text-secondary hover:bg-background",
                    )}
                  >
                    {status || "All"}
                  </button>
                ))}
              </div>
            )}
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("");
                  setStatusFilter("");
                }}
                className="text-sm font-medium text-primary hover:underline"
              >
                Reset
              </button>
            )}
            <div className="flex rounded-lg border border-border bg-background p-0.5">
              <button
                type="button"
                onClick={() => setView("table")}
                className={clsx(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  view === "table"
                    ? "bg-surface text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                <Rows3 className="h-3.5 w-3.5" />
                Table
              </button>
              <button
                type="button"
                onClick={() => setView("card")}
                className={clsx(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  view === "card"
                    ? "bg-surface text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Cards
              </button>
            </div>
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

          {!isLoading && filtered.length > 0 && view === "table" && (
            <PackageTable
              services={filtered}
              canManage={canManage}
              enrollmentCounts={enrollmentCounts}
              onApprove={handleApprove}
              onReject={setRejectingService}
              onEdit={setEditingService}
              onDelete={setDeletingService}
              onToggleActive={(service) =>
                toggleServiceActive.mutate({ id: service.id, makeActive: !service.isActive })
              }
              approvingId={reviewService.isPending ? reviewService.variables?.id : undefined}
              togglingId={toggleServiceActive.isPending ? toggleServiceActive.variables?.id : undefined}
            />
          )}
        </div>
      </Card>

      {!isLoading &&
        view === "card" &&
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
                        <PackageActions
                          service={service}
                          canManage={canManage}
                          onApprove={handleApprove}
                          onReject={setRejectingService}
                          onEdit={setEditingService}
                          onDelete={setDeletingService}
                          onToggleActive={(s) =>
                            toggleServiceActive.mutate({ id: s.id, makeActive: !s.isActive })
                          }
                          isApproving={
                            reviewService.isPending && reviewService.variables?.id === service.id
                          }
                          isToggling={
                            toggleServiceActive.isPending &&
                            toggleServiceActive.variables?.id === service.id
                          }
                        />
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
        onClose={() => {
          setIsAddOpen(false);
          setAddError(undefined);
        }}
        onSubmit={handleCreate}
        isSubmitting={createService.isPending}
        apiError={addError}
        requiresApproval={!canManage}
      />

      {canManage && (
        <>
          <Modal
            open={Boolean(editingService)}
            onClose={() => {
              setEditingService(null);
              setEditError(undefined);
            }}
            title="Edit Package"
            description="Package details are shown across enrollment flows and the catalog."
          >
            {editingService && (
              <ServiceForm
                initialValues={editingService}
                onSubmit={handleUpdate}
                onCancel={() => {
                  setEditingService(null);
                  setEditError(undefined);
                }}
                isSubmitting={updateService.isPending}
                apiError={editError}
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
          <ConfirmDialog
            open={Boolean(deleteBlocked)}
            onClose={() => setDeleteBlocked(null)}
            onConfirm={handleDeactivateInstead}
            title="Can't delete this package"
            description={deleteBlocked?.message}
            confirmLabel="Deactivate Instead"
            isLoading={toggleServiceActive.isPending}
          />
          <RejectPackageModal
            service={rejectingService}
            onClose={() => setRejectingService(null)}
          />
        </>
      )}
    </div>
  );
}
