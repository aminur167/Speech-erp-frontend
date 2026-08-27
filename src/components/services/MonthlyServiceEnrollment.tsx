"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Stepper";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ScheduleList } from "@/components/services/ScheduleList";
import { PatientSearchInput } from "@/components/patients/PatientSearchInput";
import { PaymentMethodSelector } from "@/components/payments/PaymentMethodSelector";
import { PaymentSummary } from "@/components/payments/PaymentSummary";
import { Receipt } from "@/components/payments/Receipt";
import { useServices } from "@/hooks/services/useServices";
import { usePatients } from "@/hooks/patients/usePatients";
import { useCreatePayment } from "@/hooks/payments/useCreatePayment";
import { useCreateMonthlyEnrollment } from "@/hooks/enrollments/useCreateMonthlyEnrollment";
import { usePayMonthlyBill } from "@/hooks/enrollments/usePayMonthlyBill";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/currency";
import type { Patient, Service, PaymentMethod, Payment, MonthlyEnrollment } from "@/types/domain";

type Step = "service" | "patient" | "enroll" | "bills" | "payment" | "receipt";

const STEP_ORDER: Step[] = ["service", "patient", "enroll", "bills", "payment", "receipt"];
const STEP_LABELS: Record<Step, string> = {
  service: "Select Service",
  patient: "Search Patient",
  enroll: "Create Enrollment",
  bills: "View Current Bill",
  payment: "Payment",
  receipt: "Receipt",
};

export function MonthlyServiceEnrollment() {
  const user = useAuthStore((state) => state.user);
  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [enrollment, setEnrollment] = useState<MonthlyEnrollment | null>(null);
  const [payingMonth, setPayingMonth] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [payment, setPayment] = useState<Payment | null>(null);

  const { data: services, isLoading: servicesLoading } = useServices("monthly");
  const { data: patientResults, isLoading: patientsLoading } = usePatients({
    search,
    pageSize: 5,
  });
  const createEnrollment = useCreateMonthlyEnrollment();
  const payBill = usePayMonthlyBill();
  const createPayment = useCreatePayment();

  const stepIndex = STEP_ORDER.indexOf(step);
  const dueBill = enrollment?.bills.find((bill) => bill.status === "due");

  const handleCreateEnrollment = () => {
    if (!selectedService || !selectedPatient || !user) return;
    createEnrollment.mutate(
      {
        patientId: selectedPatient.id,
        serviceId: selectedService.id,
        branchId: user.branchId ?? "branch-1",
        fee: selectedService.fee,
      },
      {
        onSuccess: (created) => {
          setEnrollment(created);
          setStep("bills");
        },
      },
    );
  };

  const handleCollectPayment = () => {
    if (!selectedPatient || !user || !enrollment || !payingMonth) return;
    const bill = enrollment.bills.find((b) => b.month === payingMonth);
    if (!bill) return;
    createPayment.mutate(
      {
        patientId: selectedPatient.id,
        amount: bill.amount,
        method,
        collectedBy: user.name,
        branchId: user.branchId ?? "branch-1",
      },
      {
        onSuccess: (createdPayment) => {
          payBill.mutate(
            { enrollmentId: enrollment.id, month: payingMonth },
            {
              onSuccess: (updated) => {
                setEnrollment(updated);
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
    setEnrollment(null);
    setPayingMonth(null);
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
              Choose a monthly service
            </h2>
            {servicesLoading && <LoadingState label="Loading services…" />}
            {!servicesLoading && (!services || services.length === 0) && (
              <EmptyState label="No monthly services available." />
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
                    setStep("enroll");
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
              <Button variant="secondary" onClick={() => setStep("service")}>
                ← Back
              </Button>
            </div>
          </div>
        )}

        {step === "enroll" && selectedPatient && selectedService && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-text-secondary">Confirm enrollment</h2>
            <PaymentSummary patient={selectedPatient} service={selectedService} />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep("patient")}>
                ← Back
              </Button>
              <Button onClick={handleCreateEnrollment} isLoading={createEnrollment.isPending}>
                Create Enrollment
              </Button>
            </div>
          </div>
        )}

        {step === "bills" && enrollment && selectedService && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-text-secondary">
              {selectedService.name} — Monthly Fee: {formatCurrency(selectedService.fee)}
            </h2>
            <ScheduleList
              items={enrollment.bills.map((bill) => ({
                key: bill.month,
                label: bill.label,
                amount: bill.amount,
                status: bill.status,
              }))}
              onCollectPayment={(month) => {
                setPayingMonth(month);
                setStep("payment");
              }}
            />
          </div>
        )}

        {step === "payment" && selectedPatient && dueBill && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-text-secondary">
              Collect payment — {dueBill.label}
            </h2>
            <div className="flex justify-between rounded-lg border border-border bg-background p-4 text-sm">
              <span className="text-text-secondary">Amount Due</span>
              <span className="text-lg font-semibold text-primary-dark">
                {formatCurrency(dueBill.amount)}
              </span>
            </div>
            <PaymentMethodSelector value={method} onChange={setMethod} />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep("bills")}>
                ← Back
              </Button>
              <Button
                onClick={handleCollectPayment}
                isLoading={createPayment.isPending || payBill.isPending}
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
              branchName="Main Branch"
            />
            <div>
              <Button onClick={reset}>Start New Enrollment</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
