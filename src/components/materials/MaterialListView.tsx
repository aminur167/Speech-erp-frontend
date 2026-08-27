"use client";

import { useState } from "react";
import { Plus, Boxes, AlertTriangle, Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { StatCard } from "@/components/dashboard/StatCard";
import { MaterialTable } from "@/components/materials/MaterialTable";
import { MaterialForm } from "@/components/materials/MaterialForm";
import { AdjustStockModal } from "@/components/materials/AdjustStockModal";
import { useMaterials } from "@/hooks/materials/useMaterials";
import { useMaterialsSummary } from "@/hooks/materials/useMaterialsSummary";
import { useCreateMaterial } from "@/hooks/materials/useCreateMaterial";
import { useUpdateMaterial } from "@/hooks/materials/useUpdateMaterial";
import { useDeleteMaterial } from "@/hooks/materials/useDeleteMaterial";
import { useAdjustStock } from "@/hooks/materials/useAdjustStock";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/currency";
import type { Material, MaterialMovementType } from "@/types/domain";
import type { MaterialInput } from "@/lib/api/materials";

export function MaterialListView() {
  const user = useAuthStore((state) => state.user);
  const branchId = user?.branchId ?? "branch-1";

  const { data: materials, isLoading } = useMaterials(branchId);
  const { data: summary } = useMaterialsSummary(branchId);
  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();
  const deleteMaterialMutation = useDeleteMaterial();
  const adjustStockMutation = useAdjustStock();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(null);
  const [adjustingMaterial, setAdjustingMaterial] = useState<Material | null>(null);

  const handleCreate = (input: Omit<MaterialInput, "branchId">) => {
    createMaterial.mutate({ ...input, branchId }, { onSuccess: () => setIsAddOpen(false) });
  };

  const handleUpdate = (input: Omit<MaterialInput, "branchId">) => {
    if (!editingMaterial) return;
    updateMaterial.mutate(
      { id: editingMaterial.id, input: { ...input, branchId } },
      { onSuccess: () => setEditingMaterial(null) },
    );
  };

  const handleDelete = () => {
    if (!deletingMaterial) return;
    deleteMaterialMutation.mutate(deletingMaterial.id, {
      onSuccess: () => setDeletingMaterial(null),
    });
  };

  const handleAdjust = (input: { type: MaterialMovementType; quantity: number; note?: string }) => {
    if (!adjustingMaterial || !user) return;
    adjustStockMutation.mutate(
      { materialId: adjustingMaterial.id, ...input, branchId, createdBy: user.name },
      { onSuccess: () => setAdjustingMaterial(null) },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref="/manager/dashboard"
        breadcrumb={["Branch Manager", "Materials"]}
        title="Materials"
        subtitle="Track therapy materials and equipment stock for your branch."
        action={
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Material
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Items" value={String(summary?.totalItems ?? 0)} icon={Boxes} />
        <StatCard
          label="Stock Value"
          value={formatCurrency(summary?.totalStockValue ?? 0)}
          icon={Wallet}
          tone="success"
        />
        <StatCard
          label="Low Stock Items"
          value={String(summary?.lowStockCount ?? 0)}
          icon={AlertTriangle}
          tone={summary && summary.lowStockCount > 0 ? "danger" : "primary"}
        />
      </div>

      <Card>
        {isLoading && <LoadingState label="Loading materials…" />}
        {!isLoading && (!materials || materials.length === 0) && (
          <EmptyState label="No materials added yet." />
        )}
        {!isLoading && materials && materials.length > 0 && (
          <MaterialTable
            materials={materials}
            onAdjustStock={setAdjustingMaterial}
            onEdit={setEditingMaterial}
            onDelete={setDeletingMaterial}
          />
        )}
      </Card>

      <Modal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Material"
        description="Add a new material or equipment item to your branch's inventory."
      >
        <MaterialForm
          onSubmit={handleCreate}
          onCancel={() => setIsAddOpen(false)}
          isSubmitting={createMaterial.isPending}
        />
      </Modal>

      <Modal
        open={Boolean(editingMaterial)}
        onClose={() => setEditingMaterial(null)}
        title="Edit Material"
      >
        {editingMaterial && (
          <MaterialForm
            initialValues={editingMaterial}
            onSubmit={handleUpdate}
            onCancel={() => setEditingMaterial(null)}
            isSubmitting={updateMaterial.isPending}
          />
        )}
      </Modal>

      <AdjustStockModal
        material={adjustingMaterial}
        onClose={() => setAdjustingMaterial(null)}
        onSubmit={handleAdjust}
        isSubmitting={adjustStockMutation.isPending}
      />

      <ConfirmDialog
        open={Boolean(deletingMaterial)}
        onClose={() => setDeletingMaterial(null)}
        onConfirm={handleDelete}
        title="Delete material?"
        description={`"${deletingMaterial?.name}" will be removed from inventory. This can't be undone.`}
        confirmLabel="Delete"
        danger
        isLoading={deleteMaterialMutation.isPending}
      />
    </div>
  );
}
