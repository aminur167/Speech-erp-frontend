"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { LayoutDashboard } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
import { useCreateInstallmentPlan } from "@/hooks/enrollments/useCreateInstallmentPlan";
import { usePayInstallment } from "@/hooks/enrollments/usePayInstallment";
import { useCurrentBranchName } from "@/hooks/branches/useCurrentBranchName";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/currency";
import { toLocalDateString } from "@/utils/time";
import { generateIdempotencyKey } from "@/lib/offline/idempotency";
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
  // Defaults to a window that already works — today through 3 months out —
  // so the common case is one click, not two date pickers.
  const [startsOn, setStartsOn] = useState(() => toLocalDateString());
  const [endsOn, setEndsOn] = useState(() => {
    const end = new Date();
    end.setMonth(end.getMonth() + 3);
    return toLocalDateString(end);
  });
  const [plan, setPlan] = useState<InstallmentPlan | null>(null);
  const [payingIndex, setPayingIndex] = useState<number | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [collectAmount, setCollectAmount] = useState("");
  const [payment, setPayment] = useState<Payment | null>(null);

  const { data: services, isLoading: servicesLoading } = useServices("installment");
  const { data: patientResults, isLoading: patientsLoading } = usePatients({
    search,
    pageSize: 5,
  });
  const createPlan = useCreateInstallmentPlan();
  const payInstallmentMutation = usePayInstallment();

  const stepIndex = STEP_ORDER.indexOf(step);
  const dueInstallment = plan?.installments.find(
    (installment) => installment.status === "due" || installment.status === "overdue",
  );

  // What's left on the whole plan — the ceiling for any single collection,
  // since paying past it would invent money the plan never owed.
  const planOutstanding = plan
    ? plan.installments.reduce((sum, i) => sum + i.outstanding, 0)
    : 0;

  const collectError = (() => {
    if (collectAmount.trim() === "") return "";
    const value = Number(collectAmount);
    if (!Number.isFinite(value) || value <= 0) return "Enter an amount greater than zero.";
    if (value > planOutstanding) {
      return `That's more than the ${formatCurrency(planOutstanding)} still outstanding on this plan.`;
    }
    return "";
  })();

  // Mirrors the server's rule so the manager sees it before submitting:
  // each installment needs its own day to fall on.
  const rangeError = (() => {
    if (!startsOn || !endsOn) return "Pick both a start and an end date.";
    if (endsOn < startsOn) return "The end date is before the start date.";
    const days =
      Math.round(
        (new Date(endsOn).getTime() - new Date(startsOn).getTime()) / 86_400_000,
      ) + 1;
    if (days < numberOfInstallments) {
      return `That window is only ${days} day${days === 1 ? "" : "s"} — too short for ${numberOfInstallments} installments.`;
    }
    return "";
  })();

  const handleCreatePlan = () => {
    if (!selectedService || !selectedPatient || !user || rangeError) return;
    createPlan.mutate(
      {
        patientId: selectedPatient.id,
        serviceId: selectedService.id,
        numberOfInstallments,
        startsOn,
        endsOn,
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
    if (!selectedPatient || !user || !plan || payingIndex == null || collectError) return;
    const installment = plan.installments.find((i) => i.index === payingIndex);
    if (!installment) return;
    // One atomic call -- see the same note in MonthlyServiceEnrollment.
    payInstallmentMutation.mutate(
      {
        planId: plan.id,
        installmentId: installment.id,
        method,
        idempotencyKey: generateIdempotencyKey(),
        // Blank means "the scheduled figure", which the server already
        // defaults to — no need to send a number the user didn't choose.
        amount: collectAmount.trim() === "" ? undefined : Number(collectAmount),
      },
      {
        onSuccess: ({ payment: createdPayment, plan: updated }) => {
          setPlan(updated);
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
    setNumberOfInstallments(3);
    setPlan(null);
    setPayingIndex(null);
    setMethod("cash");
    setCollectAmount("");
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

            <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
              <p className="text-xs font-medium text-text-secondary">
                Clear the plan between
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  aria-label="Plan start date"
                  value={startsOn}
                  onChange={(event) => setStartsOn(event.target.value)}
                  containerClassName="w-44"
                />
                <span className="text-xs text-text-secondary">to</span>
                <Input
                  type="date"
                  aria-label="Plan end date"
                  value={endsOn}
                  min={startsOn || undefined}
                  onChange={(event) => setEndsOn(event.target.value)}
                  containerClassName="w-44"
                />
              </div>
              <p className="text-xs text-text-secondary">
                The {numberOfInstallments} due dates are spread evenly across this
                window — the first on the start date, the last on the end date.
              </p>
              {rangeError && <p className="text-xs text-danger">{rangeError}</p>}
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep("patient")}>
                ← Back
              </Button>
              <Button
                onClick={handleCreatePlan}
                isLoading={createPlan.isPending}
                disabled={Boolean(rangeError)}
              >
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
                amountPaid: installment.amountPaid,
                outstanding: installment.outstanding,
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
              <span className="text-text-secondary">Scheduled for this installment</span>
              <span className="text-lg font-semibold text-primary-dark">
                {formatCurrency(dueInstallment.amount)}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-text-secondary">
                Amount to collect now
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={planOutstanding}
                value={collectAmount}
                onChange={(event) => setCollectAmount(event.target.value)}
                placeholder={String(dueInstallment.amount)}
              />
              <p className="text-xs text-text-secondary">
                Take whatever the patient can pay today. Anything short of the
                scheduled figure is shared across the later installments —{" "}
                {formatCurrency(planOutstanding)} is outstanding on the whole plan.
              </p>
              {collectError && <p className="text-xs text-danger">{collectError}</p>}
            </div>

            <PaymentMethodSelector value={method} onChange={setMethod} />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep("schedule")}>
                ← Back
              </Button>
              <Button
                onClick={handleCollectPayment}
                isLoading={payInstallmentMutation.isPending}
                disabled={Boolean(collectError)}
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
