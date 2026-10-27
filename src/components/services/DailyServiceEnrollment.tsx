"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Stepper";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { ServiceCard } from "@/components/services/ServiceCard";
import { PatientSearchInput } from "@/components/patients/PatientSearchInput";
import { PatientSearchResultList } from "@/components/patients/PatientSearchResultList";
import { PaymentMethodSelector } from "@/components/payments/PaymentMethodSelector";
import { PaymentSummary } from "@/components/payments/PaymentSummary";
import { DiscountFields } from "@/components/payments/DiscountFields";
import { Receipt } from "@/components/payments/Receipt";
import { useServices } from "@/hooks/services/useServices";
import { usePatients } from "@/hooks/patients/usePatients";
import { useChargeDailySession } from "@/hooks/payments/useChargeDailySession";
import { useDiscount } from "@/hooks/useDiscount";
import { useCurrentBranchName } from "@/hooks/branches/useCurrentBranchName";
import { formatCurrency } from "@/utils/currency";
import { useAuthStore } from "@/store/authStore";
import type { Patient, Service, PaymentMethod, Payment } from "@/types/domain";

type Step = "service" | "patient" | "confirm" | "payment" | "receipt";

const STEP_ORDER: Step[] = ["service", "patient", "confirm", "payment", "receipt"];
const STEP_LABELS: Record<Step, string> = {
  service: "Select Service",
  patient: "Search Patient",
  confirm: "Confirm Patient",
  payment: "Payment",
  receipt: "Receipt",
};

export function DailyServiceEnrollment() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const branchName = useCurrentBranchName();
  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [payment, setPayment] = useState<Payment | null>(null);

  const { data: services, isLoading: servicesLoading } = useServices("daily");
  const { data: patientResults, isLoading: patientsLoading } = usePatients({
    search,
    pageSize: 5,
  });
  const chargeSession = useChargeDailySession();

  const fee = selectedService?.fee ?? 0;
  // A paisa short of the fee, matching the server: a daily session raises no
  // bill, so a free one would leave no record of the visit at all.
  const discount = useDiscount({
    charge: fee,
    ceiling: Math.max(0, fee - 0.01),
    what: "session fee",
  });

  const stepIndex = STEP_ORDER.indexOf(step);

  const handleCollectPayment = () => {
    if (!selectedService || !selectedPatient || !user || !discount.isValid) return;
    // No amount: the server charges the catalogue fee less the discount, so
    // a discount is recorded as one rather than inferred from a smaller
    // number (see chargeDailySession).
    chargeSession.mutate(
      {
        patientId: selectedPatient.id,
        serviceId: selectedService.id,
        method,
        ...discount.payload,
      },
      {
        onSuccess: (createdPayment) => {
          setPayment(createdPayment);
          setStep("receipt");
        },
      },
    );
  };

  const reset = () => {
    setStep("service");
    setSelectedService(null);
    setSearch("");
    setSelectedPatient(null);
    setMethod("cash");
    setPayment(null);
    discount.reset();
  };

  return (
    <div className="flex flex-col gap-6">
      <Stepper steps={STEP_ORDER.map((s) => STEP_LABELS[s])} currentIndex={stepIndex} />

      <Card>
        {step === "service" && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-text-secondary">
              Choose a daily service
            </h2>
            {servicesLoading && <LoadingState label="Loading services…" />}
            {!servicesLoading && (!services || services.length === 0) && (
              <EmptyState label="No daily services available." />
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {services?.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  selected={selectedService?.id === service.id}
                  onSelect={(s) => {
                    setSelectedService(s);
                    setStep("patient");
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {step === "patient" && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-text-secondary">
              Search for the patient
            </h2>
            <PatientSearchInput onSearch={setSearch} />
            <PatientSearchResultList
              results={patientResults?.results}
              isLoading={patientsLoading}
              search={search}
              onSelect={(patient) => {
                setSelectedPatient(patient);
                setStep("confirm");
              }}
            />
            <div>
              <Button variant="secondary" onClick={() => setStep("service")}>
                ← Back
              </Button>
            </div>
          </div>
        )}

        {step === "confirm" && selectedPatient && selectedService && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-text-secondary">Confirm details</h2>
            <PaymentSummary patient={selectedPatient} service={selectedService} />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep("patient")}>
                ← Back
              </Button>
              <Button onClick={() => setStep("payment")}>Continue to Payment</Button>
            </div>
          </div>
        )}

        {step === "payment" && selectedPatient && selectedService && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-text-secondary">Collect payment</h2>
            <PaymentSummary patient={selectedPatient} service={selectedService} />
            <DiscountFields
              discount={discount}
              max={Math.max(0, fee - 0.01)}
              reasonPlaceholder="e.g. Sibling already enrolled"
            />
            {discount.value > 0 && !discount.amountError && (
              <div className="flex justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm">
                <span className="text-text-secondary">To collect</span>
                <span className="text-lg font-semibold text-primary-dark">
                  {formatCurrency(discount.net)}
                </span>
              </div>
            )}
            <PaymentMethodSelector value={method} onChange={setMethod} />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep("confirm")}>
                ← Back
              </Button>
              <Button
                onClick={handleCollectPayment}
                isLoading={chargeSession.isPending}
                disabled={!discount.isValid}
              >
                Confirm Payment
              </Button>
            </div>
          </div>
        )}

        {step === "receipt" && payment && selectedPatient && selectedService && (
          <div className="flex flex-col gap-4">
            <Receipt
              payment={payment}
              patientName={selectedPatient.name}
              serviceName={selectedService.name}
              branchName={branchName}
            />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => router.push("/manager/dashboard")}>
                <LayoutDashboard className="h-4 w-4" />
                Go to Dashboard
              </Button>
              <Button onClick={reset}>Start New Enrollment</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
