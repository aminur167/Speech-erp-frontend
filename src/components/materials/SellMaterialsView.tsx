"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { PatientSearchInput } from "@/components/patients/PatientSearchInput";
import { PaymentMethodSelector } from "@/components/payments/PaymentMethodSelector";
import { Receipt } from "@/components/payments/Receipt";
import { useMaterials } from "@/hooks/materials/useMaterials";
import { usePatients } from "@/hooks/patients/usePatients";
import { useSellMaterials } from "@/hooks/materials/useSellMaterials";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/currency";
import type { Material, Patient, Payment, PaymentMethod } from "@/types/domain";

type Stage = "cart" | "checkout" | "receipt";

interface CartLine {
  materialId: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  maxQuantity: number;
}

export function SellMaterialsView() {
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const branchId = user?.branchId ?? "branch-1";

  const { data: materials, isLoading } = useMaterials(branchId);
  const sellMaterials = useSellMaterials();

  const [catalogSearch, setCatalogSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [stage, setStage] = useState<Stage>("cart");
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [payment, setPayment] = useState<Payment | null>(null);

  const { data: patientResults, isLoading: patientsLoading } = usePatients({
    search: patientSearch,
    pageSize: 5,
  });

  const [handledAddId, setHandledAddId] = useState<string | null>(null);

  const addToCart = (material: Material) => {
    setCart((prev) => {
      const existing = prev.find((line) => line.materialId === material.id);
      if (existing) {
        if (existing.quantity >= existing.maxQuantity) return prev;
        return prev.map((line) =>
          line.materialId === material.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [
        ...prev,
        {
          materialId: material.id,
          name: material.name,
          unit: material.unit,
          unitPrice: material.sellingPrice,
          quantity: 1,
          maxQuantity: material.quantity,
        },
      ];
    });
  };

  const addId = searchParams.get("add");
  if (materials && addId && addId !== handledAddId) {
    const material = materials.find((m) => m.id === addId);
    if (material && material.quantity > 0) addToCart(material);
    setHandledAddId(addId);
  }

  const filteredCatalog = useMemo(() => {
    const query = catalogSearch.trim().toLowerCase();
    if (!query) return materials ?? [];
    return (materials ?? []).filter(
      (m) => m.name.toLowerCase().includes(query) || m.code.toLowerCase().includes(query),
    );
  }, [materials, catalogSearch]);

  const updateQuantity = (materialId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((line) =>
          line.materialId === materialId
            ? { ...line, quantity: Math.min(line.maxQuantity, Math.max(0, line.quantity + delta)) }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  };

  const removeLine = (materialId: string) => {
    setCart((prev) => prev.filter((line) => line.materialId !== materialId));
  };

  const total = cart.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);

  const resetSale = () => {
    setCart([]);
    setStage("cart");
    setPatientSearch("");
    setSelectedPatient(null);
    setMethod("cash");
    setPayment(null);
  };

  const handleConfirm = () => {
    if (!selectedPatient || !user || cart.length === 0) return;
    sellMaterials.mutate(
      {
        items: cart.map((line) => ({
          materialId: line.materialId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        })),
        patientId: selectedPatient.id,
        method,
        branchId,
        createdBy: user.name,
      },
      {
        onSuccess: ({ payment: createdPayment }) => {
          setPayment(createdPayment);
          setStage("receipt");
        },
      },
    );
  };

  const cartSummaryLabel = cart.map((line) => `${line.name} × ${line.quantity}`).join(", ");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref="/manager/dashboard"
        breadcrumb={["Branch Manager", "Materials", "Sell"]}
        title="Sell Materials"
        subtitle="Pick products from your branch's inventory and check out a retail sale."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
        <Card className="flex flex-col gap-3 lg:sticky lg:top-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <Input
              value={catalogSearch}
              onChange={(event) => setCatalogSearch(event.target.value)}
              placeholder="Search products…"
              className="pl-9"
            />
          </div>

          <div className="flex max-h-[calc(100vh-16rem)] flex-col gap-2 overflow-y-auto pr-1">
            {isLoading && <LoadingState label="Loading products…" />}
            {!isLoading && filteredCatalog.length === 0 && (
              <EmptyState label="No products found." />
            )}
            {!isLoading &&
              filteredCatalog.map((material) => {
                const inCart = cart.find((line) => line.materialId === material.id);
                const isOutOfStock = material.quantity === 0;
                const isMaxed = Boolean(inCart && inCart.quantity >= material.quantity);
                return (
                  <button
                    key={material.id}
                    type="button"
                    onClick={() => addToCart(material)}
                    disabled={isOutOfStock || isMaxed}
                    className={clsx(
                      "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      isOutOfStock || isMaxed
                        ? "cursor-not-allowed border-border bg-background opacity-50"
                        : "border-border bg-surface hover:border-primary/40 hover:bg-primary-light/30",
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-text-primary">{material.name}</span>
                      <span className="font-mono text-xs text-text-secondary">
                        {material.code} · {material.quantity} {material.unit} left
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-semibold text-primary-dark">
                        {formatCurrency(material.sellingPrice)}
                      </span>
                      {isOutOfStock ? (
                        <Badge tone="danger" label="Out of stock" />
                      ) : (
                        <Plus className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                  </button>
                );
              })}
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          {stage === "cart" && (
            <>
              <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                <ShoppingCart className="h-4 w-4" />
                Current Sale
              </div>

              {cart.length === 0 && (
                <EmptyState label="Add products from the list to start a sale." />
              )}

              {cart.length > 0 && (
                <div className="flex flex-col gap-2">
                  {cart.map((line) => (
                    <div
                      key={line.materialId}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-text-primary">{line.name}</span>
                        <span className="text-xs text-text-secondary">
                          {formatCurrency(line.unitPrice)} / {line.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(line.materialId, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-secondary hover:border-primary/40 hover:text-primary"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium text-text-primary">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(line.materialId, 1)}
                          disabled={line.quantity >= line.maxQuantity}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-secondary hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-20 text-right text-sm font-semibold text-text-primary">
                          {formatCurrency(line.quantity * line.unitPrice)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeLine(line.materialId)}
                          className="text-text-secondary hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm text-text-secondary">Total</span>
                <span className="text-xl font-semibold text-primary-dark">
                  {formatCurrency(total)}
                </span>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setStage("checkout")} disabled={cart.length === 0}>
                  Proceed to Checkout
                </Button>
              </div>
            </>
          )}

          {stage === "checkout" && (
            <>
              <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4 text-sm">
                <span className="text-text-secondary">{cartSummaryLabel}</span>
                <span className="text-lg font-semibold text-primary-dark">
                  {formatCurrency(total)}
                </span>
              </div>

              {!selectedPatient && (
                <div className="flex flex-col gap-3">
                  <h2 className="text-sm font-medium text-text-secondary">
                    Select the patient
                  </h2>
                  <PatientSearchInput onSearch={setPatientSearch} />
                  {patientsLoading && <LoadingState label="Searching…" />}
                  {!patientsLoading &&
                    patientSearch &&
                    patientResults?.results.length === 0 && (
                      <EmptyState label="No matching patients." />
                    )}
                  <div className="flex flex-col gap-2">
                    {patientResults?.results.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => setSelectedPatient(patient)}
                        className="flex items-center justify-between rounded-lg border border-border px-4 py-2 text-left text-sm transition-colors hover:border-primary/40 hover:bg-primary-light/40"
                      >
                        <span className="font-medium text-text-primary">{patient.name}</span>
                        <span className="font-mono text-xs text-text-secondary">
                          {patient.patientCode}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedPatient && (
                <>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4 text-sm">
                    <span className="text-text-secondary">Patient</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">
                        {selectedPatient.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedPatient(null)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                  <PaymentMethodSelector value={method} onChange={setMethod} />
                </>
              )}

              <div className="flex gap-2 border-t border-border pt-4">
                <Button variant="secondary" onClick={() => setStage("cart")}>
                  ← Back to Cart
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={!selectedPatient}
                  isLoading={sellMaterials.isPending}
                >
                  Confirm Sale
                </Button>
              </div>
            </>
          )}

          {stage === "receipt" && payment && selectedPatient && (
            <div className="flex flex-col gap-4">
              <Receipt
                payment={payment}
                patientName={selectedPatient.name}
                serviceName={cartSummaryLabel}
                branchName="Main Branch"
              />
              <Button onClick={resetSale}>Start New Sale</Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
