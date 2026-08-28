"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { LayoutDashboard } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Stepper";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ScheduleList } from "@/components/services/ScheduleList";
import { PatientSearchInput } from "@/components/patients/PatientSearchInput";
import { PatientSearchResultList } from "@/components/patients/PatientSearchResultList";
import { PaymentMethodSelector } from "@/components/payments/PaymentMethodSelector";
import { Receipt } from "@/components/payments/Receipt";
import { useServices } from "@/hooks/services/useServices";
import { usePatients } from "@/hooks/patients/usePatients";
import { useCreatePayment } from "@/hooks/payments/useCreatePayment";
import { useCreateInstallmentPlan } from "@/hooks/enrollments/useCreateInstallmentPlan";
import { usePayInstallment } from "@/hooks/enrollments/usePayInstallment";
import { useCurrentBranchName } from "@/hooks/branches/useCurrentBranchName";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/currency";
import type { Patient, Service, PaymentMethod, Payment, InstallmentPlan } from "@/types/domain";

type Step = "service" | "patient" | "plan" | "schedule" | "payment" | "receipt";

const STEP_ORDER: Step[] = ["service", "patient", "plan", "schedule", "payment", "receipt"];
const STEP_LABELS: Record<Step, string> = {
  service: "Select Service",
  patient: "Search Patient",
  plan: "Select Installment Plan",
  schedule: "View Schedule",
  payment: "Collect Payment",
  receipt: "Receipt",
};

const PLAN_OPTIONS = [2, 3, 4];

export function InstallmentServiceEnrollment() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const branchName = useCurrentBranchName();
  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [numberOfInstallments, setNumberOfInstallments] = useState(3);
  const [plan, setPlan] = useState<InstallmentPlan | null>(null);
  const [payingIndex, setPayingIndex] = useState<number | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [payment, setPayment] = useState<Payment | null>(null);

  const { data: services, isLoading: servicesLoading } = useServices("installment");
  const { data: patientResults, isLoading: patientsLoading } = usePatients({
    search,
    pageSize: 5,
  });
  const createPlan = useCreateInstallmentPlan();
  const payInstallmentMutation = usePayInstallment();
  const createPayment = useCreatePayment();

  const stepIndex = STEP_ORDER.indexOf(step);
  const dueInstallment = plan?.installments.find((installment) => installment.status === "due");

  const handleCreatePlan = () => {
    if (!selectedService || !selectedPatient || !user) return;
    createPlan.mutate(
      {
        patientId: selectedPatient.id,
        serviceId: selectedService.id,
        branchId: user.branchId ?? "branch-1",
        totalAmount: selectedService.fee,
        numberOfInstallments,
      },
      {
        onSuccess: (created) => {
          setPlan(created);
          setStep("schedule");
        },
      },
    );
  };

  const handleCollectPayment = () => {
    if (!selectedPatient || !user || !plan || payingIndex == null) return;
    const installment = plan.installments.find((i) => i.index === payingIndex);
    if (!installment) return;
    createPayment.mutate(
      {
        patientId: selectedPatient.id,
        amount: installment.amount,
        method,
        category: "installment",
        collectedBy: user.name,
        branchId: user.branchId ?? "branch-1",
      },
      {
        onSuccess: (createdPayment) => {
          payInstallmentMutation.mutate(
            { planId: plan.id, index: payingIndex },
            {
              onSuccess: (updated) => {
                setPlan(updated);
                setPayment(createdPayment);
                setStep("receipt");
              },
            },
          );
        },
      },
    );
  };

  const reset = () => {
    setStep("service");
    setSelectedService(null);
    setSearch("");
    setSelectedPatient(null);
    setNumberOfInstallments(3);
    setPlan(null);
    setPayingIndex(null);
    setMethod("cash");
    setPayment(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <Stepper steps={STEP_ORDER.map((s) => STEP_LABELS[s])} currentIndex={stepIndex} />

      <Card>
        {step === "service" && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-text-secondary">
              Choose an installment service
            </h2>
            {servicesLoading && <LoadingState label="Loading services…" />}
            {!servicesLoading && (!services || services.length === 0) && (
              <EmptyState label="No installment services available." />
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
                setStep("plan");
              }}
            />
            <div>
              <Button variant="secondary" onClick={() => setStep("service")}>
                ← Back
              </Button>
            </div>
          </div>
        )}

        {step === "plan" && selectedPatient && selectedService && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-text-secondary">
              {selectedService.name} — Total: {formatCurrency(selectedService.fee)}
            </h2>
            <div className="flex gap-2">
              {PLAN_OPTIONS.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setNumberOfInstallments(count)}
                  className={clsx(
                    "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                    numberOfInstallments === count
                      ? "border-primary bg-primary-light text-primary-dark"
                      : "border-border text-text-secondary hover:border-primary/40",
                  )}
                >
                  {count} Installments
                </button>
              ))}
            </div>
            <p className="text-xs text-text-secondary">
              {numberOfInstallments} installments of approximately{" "}
              {formatCurrency(Math.floor(selectedService.fee / numberOfInstallments))} each.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep("patient")}>
                ← Back
              </Button>
              <Button onClick={handleCreatePlan} isLoading={createPlan.isPending}>
                Create Plan
              </Button>
            </div>
          </div>
        )}

        {step === "schedule" && plan && selectedService && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-text-secondary">
              {selectedService.name} — Total: {formatCurrency(plan.totalAmount)}
            </h2>
            <ScheduleList
              items={plan.installments.map((installment) => ({
                key: String(installment.index),
                label: installment.label,
                amount: installment.amount,
                status: installment.status,
              }))}
              onCollectPayment={(key) => {
                setPayingIndex(Number(key));
                setStep("payment");
              }}
            />
          </div>
        )}

        {step === "payment" && selectedPatient && dueInstallment && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-text-secondary">
              Collect payment — {dueInstallment.label}
            </h2>
            <div className="flex justify-between rounded-lg border border-border bg-background p-4 text-sm">
              <span className="text-text-secondary">Amount Due</span>
              <span className="text-lg font-semibold text-primary-dark">
                {formatCurrency(dueInstallment.amount)}
              </span>
            </div>
            <PaymentMethodSelector value={method} onChange={setMethod} />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep("schedule")}>
                ← Back
              </Button>
              <Button
                onClick={handleCollectPayment}
                isLoading={createPayment.isPending || payInstallmentMutation.isPending}
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
