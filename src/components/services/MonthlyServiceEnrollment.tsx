"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { PaymentSummary } from "@/components/payments/PaymentSummary";
import { Receipt } from "@/components/payments/Receipt";
import { useServices } from "@/hooks/services/useServices";
import { usePatients } from "@/hooks/patients/usePatients";
import { useCreateMonthlyEnrollment } from "@/hooks/enrollments/useCreateMonthlyEnrollment";
import { usePayMonthlyBill } from "@/hooks/enrollments/usePayMonthlyBill";
import {
  useAdvanceOptions,
  useAdvancePreview,
  useCollectMonthlyAdvance,
} from "@/hooks/enrollments/useMonthlyAdvance";
import { usePatientOutstandingDues } from "@/hooks/patients/usePatientOutstandingDues";
import { AdvanceMonthPicker } from "@/components/enrollments/AdvanceMonthPicker";
import { OutstandingDueNotice } from "@/components/enrollments/OutstandingDueNotice";
import { useCurrentBranchName } from "@/hooks/branches/useCurrentBranchName";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/currency";
import { generateIdempotencyKey } from "@/lib/offline/idempotency";
import type { Patient, Service, PaymentMethod, Payment, MonthlyEnrollment } from "@/types/domain";

type Step =
  | "service"
  | "patient"
  | "enroll"
  | "bills"
  | "payment"
  | "advance"
  | "receipt";

const STEP_ORDER: Step[] = [
  "service",
  "patient",
  "enroll",
  "bills",
  "payment",
  "advance",
  "receipt",
];
const STEP_LABELS: Record<Step, string> = {
  service: "Select Service",
  patient: "Search Patient",
  enroll: "Create Enrollment",
  bills: "View Current Bill",
  payment: "Current Month Payment",
  advance: "Advance Payment",
  receipt: "Receipt",
};

export function MonthlyServiceEnrollment() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const branchName = useCurrentBranchName();
  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [enrollment, setEnrollment] = useState<MonthlyEnrollment | null>(null);
  const [payingMonth, setPayingMonth] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [payment, setPayment] = useState<Payment | null>(null);
  const [advanceMonths, setAdvanceMonths] = useState<string[]>([]);
  const [advancePayments, setAdvancePayments] = useState<Payment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: services, isLoading: servicesLoading } = useServices("monthly");
  const { data: patientResults, isLoading: patientsLoading } = usePatients({
    search,
    pageSize: 5,
  });
  const createEnrollment = useCreateMonthlyEnrollment();
  const payBill = usePayMonthlyBill();
  const collectAdvance = useCollectMonthlyAdvance();

  // Read as soon as a patient is chosen, so the block is explained on the
  // confirm step rather than discovered when Create Enrollment is refused.
  const { data: outstanding } = usePatientOutstandingDues(selectedPatient?.id);
  const outstandingTotal = outstanding?.total ?? 0;

  const { data: advanceOptions, isLoading: advanceLoading } = useAdvanceOptions(
    step === "advance" ? enrollment?.id : undefined,
  );
  const { data: advancePreview } = useAdvancePreview(
    step === "advance" ? enrollment?.id : undefined,
    advanceMonths,
  );

  const stepIndex = STEP_ORDER.indexOf(step);
  const dueBill = enrollment?.bills.find(
    (bill) => bill.status === "due" || bill.status === "overdue",
  );

  const handleCreateEnrollment = () => {
    if (!selectedService || !selectedPatient || !user) return;
    setError(null);
    createEnrollment.mutate(
      {
        patientId: selectedPatient.id,
        serviceId: selectedService.id,
      },
      {
        onSuccess: (created) => {
          setEnrollment(created);
          setStep("bills");
        },
        // Chiefly the outstanding-due refusal. The server is the authority on
        // it; the notice above the button is only the explanation.
        onError: (failure) => setError(failure.message),
      },
    );
  };

  const toggleAdvanceMonth = (month: string) =>
    setAdvanceMonths((current) =>
      current.includes(month)
        ? current.filter((one) => one !== month)
        : [...current, month],
    );

  const handleCollectAdvance = () => {
    if (!enrollment || advanceMonths.length === 0) return;
    setError(null);
    collectAdvance.mutate(
      {
        enrollmentId: enrollment.id,
        months: advanceMonths,
        method,
        idempotencyKey: generateIdempotencyKey(),
      },
      {
        onSuccess: (result) => {
          setAdvancePayments(result.payments);
          setStep("receipt");
        },
        onError: (failure) => setError(failure.message),
      },
    );
  };

  const handleCollectPayment = () => {
    if (!selectedPatient || !user || !enrollment || !payingMonth) return;
    const bill = enrollment.bills.find((b) => b.month === payingMonth);
    if (!bill) return;
    // One atomic call -- charges the payment and marks the bill paid
    // together, rather than two separate requests that could leave money
    // taken without the bill ever settling.
    payBill.mutate(
      { enrollmentId: enrollment.id, billId: bill.id, method, idempotencyKey: generateIdempotencyKey() },
      {
        onSuccess: ({ payment: createdPayment, enrollment: updated }) => {
          setEnrollment(updated);
          setPayment(createdPayment);
          // Straight on to the advance step: the current month is settled, so
          // months ahead are now allowed. Skipping it is one click.
          setStep("advance");
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
    setAdvanceMonths([]);
    setAdvancePayments([]);
    setError(null);
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
            <PatientSearchResultList
              results={patientResults?.results}
              isLoading={patientsLoading}
              search={search}
              onSelect={(patient) => {
                setSelectedPatient(patient);
                setStep("enroll");
              }}
            />
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
            {outstandingTotal > 0 && (
              <OutstandingDueNotice
                items={outstanding?.items ?? []}
                total={outstandingTotal}
              />
            )}
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep("patient")}>
                ← Back
              </Button>
              <Button
                onClick={handleCreateEnrollment}
                isLoading={createEnrollment.isPending}
                disabled={outstandingTotal > 0}
              >
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
                amountPaid: bill.amountPaid,
                outstanding: bill.outstanding,
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
                isLoading={payBill.isPending}
              >
                Confirm Payment
              </Button>
            </div>
          </div>
        )}

        {step === "advance" && enrollment && selectedService && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-text-secondary">
              Advance Payment — optional
            </h2>
            <p className="text-sm text-text-primary">
              The current month is settled. Pick any months the patient is paying
              for now. Months left unticked are simply not billed until they
              arrive.
            </p>

            <AdvanceMonthPicker
              months={advanceOptions?.months ?? []}
              selected={advanceMonths}
              onToggle={toggleAdvanceMonth}
              isLoading={advanceLoading}
            />

            {advancePreview && advanceMonths.length > 0 && (
              <div className="flex justify-between rounded-lg border border-border bg-background p-4 text-sm">
                <span className="text-text-secondary">
                  {advanceMonths.length}{" "}
                  {advanceMonths.length === 1 ? "month" : "months"} in advance
                </span>
                <span className="text-lg font-semibold tabular-nums text-primary-dark">
                  {formatCurrency(advancePreview.total)}
                </span>
              </div>
            )}

            {advanceMonths.length > 0 && (
              <PaymentMethodSelector value={method} onChange={setMethod} />
            )}

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep("receipt")}>
                Skip
              </Button>
              <Button
                onClick={handleCollectAdvance}
                isLoading={collectAdvance.isPending}
                disabled={advanceMonths.length === 0}
              >
                Collect Advance
              </Button>
            </div>
          </div>
        )}

        {step === "receipt" && payment && selectedPatient && selectedService && (
          <div className="flex flex-col gap-4">
            {/* Stacked rather than merged: one receipt per month is what
                makes an advance auditable month by month, and a combined
                receipt would name a month nobody was actually billed for. */}
            <div className="flex max-h-[26rem] flex-col gap-4 overflow-y-auto">
              {[payment, ...advancePayments].map((one) => (
                <Receipt
                  key={one.id}
                  payment={one}
                  patientName={selectedPatient.name}
                  serviceName={selectedService.name}
                  branchName={branchName}
                />
              ))}
            </div>
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
