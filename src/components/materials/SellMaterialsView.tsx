"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  PackageSearch,
  UserPlus,
  LayoutDashboard,
} from "lucide-react";
import { clsx } from "clsx";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Drawer } from "@/components/ui/Drawer";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { MaterialThumb } from "@/components/materials/MaterialThumb";
import { PatientSearchInput } from "@/components/patients/PatientSearchInput";
import { PaymentMethodSelector } from "@/components/payments/PaymentMethodSelector";
import { Receipt } from "@/components/payments/Receipt";
import { useMaterials } from "@/hooks/materials/useMaterials";
import { usePatients } from "@/hooks/patients/usePatients";
import { useCreatePatient } from "@/hooks/patients/useCreatePatient";
import { useSellMaterials } from "@/hooks/materials/useSellMaterials";
import { useCurrentBranchName } from "@/hooks/branches/useCurrentBranchName";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/currency";
import type { Material, MaterialUnit, Patient, Payment, PaymentMethod } from "@/types/domain";

type Stage = "cart" | "checkout" | "receipt";

interface CartLine {
  materialId: string;
  name: string;
  imageUrl?: string;
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
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const branchName = useCurrentBranchName();
  const branchId = user?.branchId ?? "branch-1";

  const { data: materials, isLoading } = useMaterials(branchId);
  const sellMaterials = useSellMaterials();
  const createPatient = useCreatePatient();

  const [catalogSearch, setCatalogSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState<MaterialUnit | "all">("all");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("cart");
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [payment, setPayment] = useState<Payment | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [isWalkInMode, setIsWalkInMode] = useState(false);
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [walkInError, setWalkInError] = useState<string>();

  const { data: patientResults, isLoading: patientsLoading } = usePatients({
    search: patientSearch,
    pageSize: 5,
  });

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
          imageUrl: material.imageUrl,
          unit: material.unit,
          unitPrice: material.sellingPrice,
          quantity: 1,
          maxQuantity: material.quantity,
        },
      ];
    });
  };

  /** Add + the transient "Added" confirmation on the button. */
  const handleAddClick = (material: Material) => {
    addToCart(material);
    setJustAddedId(material.id);
    setTimeout(() => setJustAddedId((current) => (current === material.id ? null : current)), 1200);
  };

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
    setIsCartOpen(false);
    setIsWalkInMode(false);
    setWalkInName("");
    setWalkInPhone("");
    setWalkInError(undefined);
  };

  const handleAddWalkIn = () => {
    const name = walkInName.trim();
    const phone = walkInPhone.trim();
    if (!name || !phone) {
      setWalkInError("Enter both a name and a phone number.");
      return;
    }
    createPatient.mutate(
      { name, phone },
      {
        onSuccess: (patient) => {
          setSelectedPatient(patient);
          setIsWalkInMode(false);
          setWalkInName("");
          setWalkInPhone("");
          setWalkInError(undefined);
        },
      },
    );
  };

  const handleConfirm = () => {
    if (!selectedPatient || !user || cart.length === 0) return;
    sellMaterials.mutate(
      {
        items: cart.map((line) => ({
          materialId: line.materialId,
          quantity: line.quantity,
        })),
        patientId: selectedPatient.id,
        method,
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

  const drawerTitle =
    stage === "cart" ? "Your Cart" : stage === "checkout" ? "Checkout" : "Sale Complete";
  const drawerDescription =
    stage === "cart"
      ? itemCount > 0
        ? `${itemCount} item${itemCount > 1 ? "s" : ""} in this sale`
        : undefined
      : stage === "checkout"
        ? "Choose the patient and how they're paying."
        : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref="/manager/dashboard"
        breadcrumb={["Branch Manager", "Materials", "Sell"]}
        title="Sell Materials"
        subtitle="Browse the catalog, add products to the cart, and check out a patient."
        action={
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover"
          >
            <ShoppingCart className="h-4 w-4" />
            Cart
            {itemCount > 0 && (
              <span className="ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-primary-dark">
                {itemCount}
              </span>
            )}
          </button>
        }
      />

      {/* Catalog toolbar */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <Input
            value={catalogSearch}
            onChange={(event) => setCatalogSearch(event.target.value)}
            placeholder="Search products by name or code…"
            className="pl-9"
          />
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
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                unitFilter === unit
                  ? "border-primary bg-primary-light text-primary-dark"
                  : "border-border text-text-secondary hover:border-primary/40",
              )}
            >
              {UNIT_LABELS[unit]}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <LoadingState label="Loading products…" />}
      {!isLoading && filteredCatalog.length === 0 && (
        <EmptyState label="No products match your search." />
      )}

      {/* Product grid */}
      {!isLoading && filteredCatalog.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCatalog.map((material) => {
            const inCart = cart.find((line) => line.materialId === material.id);
            const isOutOfStock = material.quantity === 0;
            const isLowStock = !isOutOfStock && material.quantity <= material.reorderLevel;
            const isMaxed = Boolean(inCart && inCart.quantity >= material.quantity);
            const justAdded = justAddedId === material.id;

            return (
              <div
                key={material.id}
                className={clsx(
                  "group relative flex flex-col overflow-hidden rounded-2xl border bg-surface transition-all duration-200",
                  isOutOfStock
                    ? "border-border opacity-60"
                    : "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg",
                )}
              >
                {inCart && (
                  <span className="absolute right-3 top-3 z-10 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white shadow-sm ring-2 ring-surface">
                    {inCart.quantity}
                  </span>
                )}

                <div className="relative flex h-36 items-center justify-center border-b border-border bg-background p-5">
                  {(isOutOfStock || isLowStock) && (
                    <span className="absolute left-3 top-3">
                      {isOutOfStock ? (
                        <Badge tone="danger" label="Out of stock" />
                      ) : (
                        <Badge tone="warning" label="Low stock" />
                      )}
                    </span>
                  )}
                  <MaterialThumb
                    src={material.imageUrl}
                    alt={material.name}
                    size="lg"
                    fit="contain"
                    bordered={false}
                  />
                </div>

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex flex-col gap-1">
                    <span className="w-fit rounded-md bg-primary-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-dark">
                      {UNIT_LABELS[material.unit]}
                    </span>
                    <h3 className="font-semibold leading-tight text-text-primary">
                      {material.name}
                    </h3>
                    <p className="font-mono text-[11px] text-text-secondary">{material.code}</p>
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
                    <span className="text-xl font-bold text-primary-dark">
                      {formatCurrency(material.sellingPrice)}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {material.quantity} {material.unit} left
                    </span>
                  </div>

                  <Button
                    onClick={() => handleAddClick(material)}
                    disabled={isOutOfStock || isMaxed}
                    variant={justAdded ? "secondary" : "primary"}
                    className="w-full justify-center"
                  >
                    {justAdded ? (
                      <>
                        <Check className="h-4 w-4 text-success" />
                        Added
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        {isMaxed ? "All in cart" : "Add to Cart"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cart / checkout / receipt drawer */}
      <Drawer
        open={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        title={drawerTitle}
        description={drawerDescription}
        footer={
          stage === "receipt" ? (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => router.push("/manager/dashboard")}
                className="flex-1 justify-center"
              >
                <LayoutDashboard className="h-4 w-4" />
                Go to Dashboard
              </Button>
              <Button onClick={resetSale} className="flex-1 justify-center">
                Start New Sale
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
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
          )
        }
      >
        {stage === "cart" && (
          <div className="flex flex-col gap-3">
            {cart.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <PackageSearch className="h-9 w-9 text-text-secondary/50" />
                <p className="text-sm text-text-secondary">
                  Your cart is empty. Add products from the catalog.
                </p>
              </div>
            )}
            {cart.map((line) => (
              <div
                key={line.materialId}
                className="flex gap-3 rounded-lg border border-border p-3"
              >
                <MaterialThumb src={line.imageUrl} alt={line.name} size="md" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {line.name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {formatCurrency(line.unitPrice)} / {line.unit}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(line.materialId)}
                      aria-label={`Remove ${line.name}`}
                      className="shrink-0 text-text-secondary transition-colors hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(line.materialId, -1)}
                        aria-label="Decrease quantity"
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-secondary transition-colors hover:border-primary/40 hover:text-primary"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center text-sm font-semibold text-text-primary">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(line.materialId, 1)}
                        disabled={line.quantity >= line.maxQuantity}
                        aria-label="Increase quantity"
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-secondary transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-text-primary">
                      {formatCurrency(line.quantity * line.unitPrice)}
                    </span>
                  </div>
                  {line.quantity >= line.maxQuantity && (
                    <p className="text-[11px] text-warning">
                      Only {line.maxQuantity} in stock.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {stage === "checkout" && (
          <div className="flex flex-col gap-4">
            {/* Order summary — what they're buying, still editable via Back */}
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                Order Summary
              </p>
              {cart.map((line) => (
                <div key={line.materialId} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate text-text-primary">
                    {line.name}
                    <span className="text-text-secondary"> × {line.quantity}</span>
                  </span>
                  <span className="shrink-0 font-medium text-text-primary">
                    {formatCurrency(line.quantity * line.unitPrice)}
                  </span>
                </div>
              ))}
            </div>

            {!selectedPatient && !isWalkInMode && (
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-medium text-text-secondary">Select the patient</h3>
                <PatientSearchInput onSearch={setPatientSearch} />
                {patientsLoading && <LoadingState label="Searching…" />}
                {!patientsLoading && patientSearch && patientResults?.results.length === 0 && (
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
                <button
                  type="button"
                  onClick={() => setIsWalkInMode(true)}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs font-medium text-text-secondary transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Not in the system? Add a walk-in customer
                </button>
              </div>
            )}

            {!selectedPatient && isWalkInMode && (
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-medium text-text-secondary">Add walk-in customer</h3>
                <p className="text-xs text-text-secondary">
                  Just their name and phone — this creates a lightweight patient record so the
                  sale and receipt still carry their name.
                </p>
                <Input
                  value={walkInName}
                  onChange={(event) => setWalkInName(event.target.value)}
                  placeholder="Full name"
                />
                <Input
                  value={walkInPhone}
                  onChange={(event) => setWalkInPhone(event.target.value)}
                  placeholder="Phone number"
                  error={walkInError}
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setIsWalkInMode(false);
                      setWalkInError(undefined);
                    }}
                  >
                    ← Back to search
                  </Button>
                  <Button
                    onClick={handleAddWalkIn}
                    isLoading={createPatient.isPending}
                    className="flex-1 justify-center"
                  >
                    Add &amp; Continue
                  </Button>
                </div>
              </div>
            )}

            {selectedPatient && (
              <>
                <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3 text-sm">
                  <span className="text-text-secondary">Patient</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary">{selectedPatient.name}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedPatient(null)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Change
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-medium text-text-secondary">Payment method</h3>
                  <PaymentMethodSelector value={method} onChange={setMethod} />
                </div>
              </>
            )}
          </div>
        )}

        {stage === "receipt" && payment && selectedPatient && (
          <Receipt
            payment={payment}
            patientName={selectedPatient.name}
            serviceName={cartSummaryLabel}
            branchName={branchName}
          />
        )}
      </Drawer>
    </div>
  );
}
