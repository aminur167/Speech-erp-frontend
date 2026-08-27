"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { PatientSearchInput } from "@/components/patients/PatientSearchInput";
import { PaymentMethodSelector } from "@/components/payments/PaymentMethodSelector";
import { Receipt } from "@/components/payments/Receipt";
import { usePatients } from "@/hooks/patients/usePatients";
import { useSellMaterial } from "@/hooks/materials/useSellMaterial";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/currency";
import type { Material, Patient, Payment, PaymentMethod } from "@/types/domain";

type Step = "details" | "patient" | "payment" | "receipt";

export function SellMaterialModal({
  material,
  onClose,
}: {
  material: Material | null;
  onClose: () => void;
}) {
  const user = useAuthStore((state) => state.user);
  const [step, setStep] = useState<Step>("details");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [payment, setPayment] = useState<Payment | null>(null);

  const { data: patientResults, isLoading: patientsLoading } = usePatients({
    search,
    pageSize: 5,
  });
  const sellMaterial = useSellMaterial();

  const quantityNum = Number(quantity) || 0;
  const unitPriceNum = unitPrice === "" ? (material?.sellingPrice ?? 0) : Number(unitPrice) || 0;
  const total = quantityNum * unitPriceNum;
  const exceedsStock = material ? quantityNum > material.quantity : false;

  const reset = () => {
    setStep("details");
    setQuantity("1");
    setUnitPrice("");
    setSearch("");
    setSelectedPatient(null);
    setMethod("cash");
    setPayment(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleConfirm = () => {
    if (!material || !selectedPatient || !user) return;
    sellMaterial.mutate(
      {
        materialId: material.id,
        quantity: quantityNum,
        unitPrice: unitPriceNum,
        patientId: selectedPatient.id,
        method,
        branchId: user.branchId ?? "branch-1",
        createdBy: user.name,
      },
      {
        onSuccess: ({ payment: createdPayment }) => {
          setPayment(createdPayment);
          setStep("receipt");
        },
      },
    );
  };

  return (
    <Modal
      open={Boolean(material)}
      onClose={handleClose}
      title={material ? `Sell — ${material.name}` : "Sell Material"}
      description={
        material && step !== "receipt"
          ? `Available stock: ${material.quantity} ${material.unit}`
          : undefined
      }
    >
      {material && step === "details" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              error={exceedsStock ? "Not enough stock available." : undefined}
            />
            <Input
              type="number"
              step="0.01"
              placeholder={`Unit Price (default ${formatCurrency(material.sellingPrice)})`}
              value={unitPrice}
              onChange={(event) => setUnitPrice(event.target.value)}
            />
          </div>
          <div className="flex justify-between rounded-lg border border-border bg-background p-4 text-sm">
            <span className="text-text-secondary">Total</span>
            <span className="text-lg font-semibold text-primary-dark">
              {formatCurrency(total)}
            </span>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={() => setStep("patient")}
              disabled={!quantityNum || !unitPriceNum || exceedsStock}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {material && step === "patient" && (
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-text-secondary">Select the patient</h2>
          <PatientSearchInput onSearch={setSearch} />
          {patientsLoading && <LoadingState label="Searching…" />}
          {!patientsLoading && search && patientResults?.results.length === 0 && (
            <EmptyState label="No matching patients." />
          )}
          <div className="flex flex-col gap-2">
            {patientResults?.results.map((patient) => (
              <button
                key={patient.id}
                type="button"
                onClick={() => {
                  setSelectedPatient(patient);
                  setStep("payment");
                }}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-2 text-left text-sm transition-colors hover:border-primary/40 hover:bg-primary-light/40"
              >
                <span className="font-medium text-text-primary">{patient.name}</span>
                <span className="font-mono text-xs text-text-secondary">
                  {patient.patientCode}
                </span>
              </button>
            ))}
          </div>
          <div>
            <Button variant="secondary" onClick={() => setStep("details")}>
              ← Back
            </Button>
          </div>
        </div>
      )}

      {material && step === "payment" && selectedPatient && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between rounded-lg border border-border bg-background p-4 text-sm">
            <span className="text-text-secondary">
              {selectedPatient.name} — {quantityNum} {material.unit} ×{" "}
              {formatCurrency(unitPriceNum)}
            </span>
            <span className="text-lg font-semibold text-primary-dark">
              {formatCurrency(total)}
            </span>
          </div>
          <PaymentMethodSelector value={method} onChange={setMethod} />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep("patient")}>
              ← Back
            </Button>
            <Button onClick={handleConfirm} isLoading={sellMaterial.isPending}>
              Confirm Sale
            </Button>
          </div>
        </div>
      )}

      {material && step === "receipt" && payment && selectedPatient && (
        <div className="flex flex-col gap-4">
          <Receipt
            payment={payment}
            patientName={selectedPatient.name}
            serviceName={`${material.name} × ${quantityNum}`}
            branchName="Main Branch"
          />
          <Button onClick={handleClose}>Done</Button>
        </div>
      )}
    </Modal>
  );
}
