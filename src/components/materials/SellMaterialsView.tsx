"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Minus, Plus, Search, ShoppingCart, Trash2, PackageSearch } from "lucide-react";
import { clsx } from "clsx";
import { PageHeader } from "@/components/layout/PageHeader";
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
import type { Material, MaterialUnit, Patient, Payment, PaymentMethod } from "@/types/domain";

type Stage = "cart" | "checkout" | "receipt";

interface CartLine {
  materialId: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  maxQuantity: number;
}

const UNIT_LABELS: Record<MaterialUnit, string> = {
  piece: "Piece",
  box: "Box",
  packet: "Packet",
  set: "Set",
  bottle: "Bottle",
  other: "Other",
};

export function SellMaterialsView() {
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const branchId = user?.branchId ?? "branch-1";

  const { data: materials, isLoading } = useMaterials(branchId);
  const sellMaterials = useSellMaterials();

  const [catalogSearch, setCatalogSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState<MaterialUnit | "all">("all");
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

  const availableUnits = useMemo(() => {
    const units = new Set<MaterialUnit>();
    materials?.forEach((m) => units.add(m.unit));
    return Array.from(units);
  }, [materials]);

  const filteredCatalog = useMemo(() => {
    const query = catalogSearch.trim().toLowerCase();
    return (materials ?? []).filter((m) => {
      if (unitFilter !== "all" && m.unit !== unitFilter) return false;
      if (!query) return true;
      return m.name.toLowerCase().includes(query) || m.code.toLowerCase().includes(query);
    });
  }, [materials, catalogSearch, unitFilter]);

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

  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);
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
        subtitle="Browse the catalog, build a sale, and check out a patient in one flow."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        {/* Product catalog — the main, spacious surface */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <Input
                value={catalogSearch}
                onChange={(event) => setCatalogSearch(event.target.value)}
                placeholder="Search products by name or code…"
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setUnitFilter("all")}
              className={clsx(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                unitFilter === "all"
                  ? "border-primary bg-primary-light text-primary-dark"
                  : "border-border text-text-secondary hover:border-primary/40",
              )}
            >
              All Products
            </button>
            {availableUnits.map((unit) => (
              <button
                key={unit}
                type="button"
                onClick={() => setUnitFilter(unit)}
                className={clsx(
                  "rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                  unitFilter === unit
                    ? "border-primary bg-primary-light text-primary-dark"
                    : "border-border text-text-secondary hover:border-primary/40",
                )}
              >
                {UNIT_LABELS[unit]}
              </button>
            ))}
          </div>

          {isLoading && <LoadingState label="Loading products…" />}
          {!isLoading && filteredCatalog.length === 0 && (
            <EmptyState label="No products match your search." />
          )}

          {!isLoading && filteredCatalog.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filteredCatalog.map((material) => {
                const inCart = cart.find((line) => line.materialId === material.id);
                const isOutOfStock = material.quantity === 0;
                const isLowStock = !isOutOfStock && material.quantity <= material.reorderLevel;
                const isMaxed = Boolean(inCart && inCart.quantity >= material.quantity);
                const disabled = isOutOfStock || isMaxed;

                return (
                  <button
                    key={material.id}
                    type="button"
                    onClick={() => addToCart(material)}
                    disabled={disabled}
                    className={clsx(
                      "group relative flex flex-col gap-3 rounded-xl border bg-surface p-4 text-left transition-all",
                      disabled
                        ? "cursor-not-allowed border-border opacity-50"
                        : "border-border hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md",
                    )}
                  >
                    {inCart && (
                      <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white shadow-sm">
                        {inCart.quantity}
                      </span>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-md bg-background px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-text-secondary">
                        {UNIT_LABELS[material.unit]}
                      </span>
                      {isOutOfStock && <Badge tone="danger" label="Out of stock" />}
                      {isLowStock && <Badge tone="warning" label="Low stock" />}
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <h3 className="font-semibold leading-tight text-text-primary">
                        {material.name}
                      </h3>
                      <p className="font-mono text-[11px] text-text-secondary">{material.code}</p>
                    </div>

                    <div className="mt-auto flex items-end justify-between border-t border-border/60 pt-3">
                      <span className="text-lg font-bold text-primary-dark">
                        {formatCurrency(material.sellingPrice)}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {material.quantity} {material.unit} left
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart / checkout — a persistent register panel */}
        <div className="flex flex-col rounded-xl border border-border bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04),0_1px_6px_rgba(15,23,42,0.04)] lg:sticky lg:top-6">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <ShoppingCart className="h-4 w-4 text-primary" />
              Current Sale
            </div>
            {itemCount > 0 && stage !== "receipt" && (
              <Badge tone="info" label={`${itemCount} item${itemCount > 1 ? "s" : ""}`} />
            )}
          </div>

          <div className="flex max-h-[calc(100vh-20rem)] flex-col gap-3 overflow-y-auto px-5 py-4 lg:max-h-[calc(100vh-14rem)]">
            {stage === "cart" && (
              <>
                {cart.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <PackageSearch className="h-8 w-8 text-text-secondary/50" />
                    <p className="text-sm text-text-secondary">
                      Tap a product to add it to this sale.
                    </p>
                  </div>
                )}
                {cart.map((line) => (
                  <div
                    key={line.materialId}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-text-primary">
                        {line.name}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {formatCurrency(line.unitPrice)} / {line.unit}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(line.materialId, -1)}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-border text-text-secondary hover:border-primary/40 hover:text-primary"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center text-sm font-medium text-text-primary">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(line.materialId, 1)}
                        disabled={line.quantity >= line.maxQuantity}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-border text-text-secondary hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <span className="w-16 text-right text-sm font-semibold text-text-primary">
                        {formatCurrency(line.quantity * line.unitPrice)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeLine(line.materialId)}
                        className="text-text-secondary hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {stage === "checkout" && (
              <>
                <div className="rounded-lg border border-border bg-background p-3 text-xs text-text-secondary">
                  {cartSummaryLabel}
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
                          className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm transition-colors hover:border-primary/40 hover:bg-primary-light/40"
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
                    <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3 text-sm">
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
              </>
            )}

            {stage === "receipt" && payment && selectedPatient && (
              <Receipt
                payment={payment}
                patientName={selectedPatient.name}
                serviceName={cartSummaryLabel}
                branchName="Main Branch"
              />
            )}
          </div>

          {stage !== "receipt" && (
            <div className="flex flex-col gap-3 border-t border-border px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Total</span>
                <span className="text-xl font-bold text-primary-dark">
                  {formatCurrency(total)}
                </span>
              </div>
              {stage === "cart" && (
                <Button
                  onClick={() => setStage("checkout")}
                  disabled={cart.length === 0}
                  className="w-full justify-center"
                >
                  Proceed to Checkout
                </Button>
              )}
              {stage === "checkout" && (
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setStage("cart")}>
                    ← Back
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={!selectedPatient}
                    isLoading={sellMaterials.isPending}
                    className="flex-1 justify-center"
                  >
                    Confirm Sale
                  </Button>
                </div>
              )}
            </div>
          )}

          {stage === "receipt" && (
            <div className="border-t border-border px-5 py-4">
              <Button onClick={resetSale} className="w-full justify-center">
                Start New Sale
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
