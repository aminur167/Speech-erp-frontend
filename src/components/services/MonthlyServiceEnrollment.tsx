"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Stepper";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
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
import { useEnrollMonthly } from "@/hooks/enrollments/useCreateMonthlyEnrollment";
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
import { monthKeyLabel, toMonthKey } from "@/utils/months";
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
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [payment, setPayment] = useState<Payment | null>(null);
  // The admit-fee discount, as typed. Kept as text so a half-typed "12." is
  // not rewritten under the manager's cursor; parsed where it is used.
  const [discountText, setDiscountText] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  // One key per enrollment attempt, kept across retries: a retry after a
  // timeout replays the same request, so the server returns the enrollment
  // it already made instead of enrolling and charging twice.
  const [enrollKey, setEnrollKey] = useState<string | null>(null);
  const [advanceMonths, setAdvanceMonths] = useState<string[]>([]);
  const [advancePayments, setAdvancePayments] = useState<Payment[]>([]);

  const { data: services, isLoading: servicesLoading } = useServices("monthly");
  const { data: patientResults, isLoading: patientsLoading } = usePatients({
    search,
    pageSize: 5,
  });
  const enrollAndPay = useEnrollMonthly();
  const collectAdvance = useCollectMonthlyAdvance();

  // Read as soon as a patient is chosen, so the block is explained on the
  // confirm step rather than discovered when the payment is refused.
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

  // Nothing exists on the server until the admit fee is paid, so the
  // enrollment month shown on "View Current Bill" is a preview built from
  // the package itself. The server prices the real bill from the same
  // package and checks the discount against it; these figures only explain.
  const currentMonth = toMonthKey();
  const admissionLabel = `Admission — ${monthKeyLabel(currentMonth)}`;
  const admissionFee = selectedService?.admissionFee ?? selectedService?.fee ?? 0;
  const discount = discountText.trim() === "" ? 0 : Number(discountText);
  const validDiscount = Number.isFinite(discount) ? discount : 0;
  const finalAmount = Math.max(0, admissionFee - validDiscount);

  let discountError: string | undefined;
  if (!Number.isFinite(discount) || discount < 0) {
    discountError = "Enter a discount of 0 or more.";
  } else if (discount > admissionFee) {
    discountError = `The discount cannot be more than the admit fee (${formatCurrency(admissionFee)}).`;
  }
  const reasonError =
    validDiscount > 0 && !discountReason.trim()
      ? "Say why the discount is being given."
      : undefined;

  const handleEnrollAndPay = () => {
    if (!selectedService || !selectedPatient || !user || discountError || reasonError) return;
    const idempotencyKey = enrollKey ?? generateIdempotencyKey();
    setEnrollKey(idempotencyKey);
    enrollAndPay.mutate(
      {
        patientId: selectedPatient.id,
        serviceId: selectedService.id,
        method,
        discount: validDiscount,
        discountReason: validDiscount > 0 ? discountReason.trim() : "",
        idempotencyKey,
      },
      {
        onSuccess: ({ enrollment: created, payment: createdPayment }) => {
          setEnrollment(created);
          setPayment(createdPayment);
          // Straight on to the advance step: the enrollment month is settled,
          // so months ahead are now allowed. Skipping it is one click.
          setStep("advance");
        },
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
      },
    );
  };

  const reset = () => {
    setStep("service");
    setSelectedService(null);
    setSearch("");
    setSelectedPatient(null);
    setEnrollment(null);
    setMethod("cash");
    setPayment(null);
    setDiscountText("");
    setDiscountReason("");
    setEnrollKey(null);
    setAdvanceMonths([]);
    setAdvancePayments([]);
  };

  // Every receipt this enrollment produced. The admit fee has none when it
  // was discounted to nothing.
  const receipts = [payment, ...advancePayments].filter(
    (one): one is Payment => one !== null,
  );

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
            <p className="text-sm text-text-secondary">
              The enrollment is created when the admit fee is collected, on the
              payment step.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep("patient")}>
                ← Back
              </Button>
              <Button onClick={() => setStep("bills")} disabled={outstandingTotal > 0}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === "bills" && selectedService && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-text-secondary">
              {selectedService.name} — Admit Fee: {formatCurrency(admissionFee)} · Monthly
              Fee from next month: {formatCurrency(selectedService.fee)}
            </h2>
            <ScheduleList
              items={[
                {
                  key: currentMonth,
                  label: admissionLabel,
                  amount: admissionFee,
                  amountPaid: 0,
                  outstanding: admissionFee,
                  status: "due",
                },
              ]}
              onCollectPayment={() => setStep("payment")}
            />
            <div>
              <Button variant="secondary" onClick={() => setStep("enroll")}>
                ← Back
              </Button>
            </div>
          </div>
        )}

        {step === "payment" && selectedPatient && selectedService && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-text-secondary">
              Collect payment — {admissionLabel}
            </h2>
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Admit Fee</span>
                <span className="tabular-nums text-text-primary">
                  {formatCurrency(admissionFee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Discount</span>
                <span className="tabular-nums text-text-primary">
                  − {formatCurrency(validDiscount > 0 && !discountError ? validDiscount : 0)}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-medium text-text-primary">Final Payment</span>
                <span className="text-lg font-semibold tabular-nums text-primary-dark">
                  {formatCurrency(discountError ? admissionFee : finalAmount)}
                </span>
              </div>
            </div>

            <Input
              label="Discount (৳)"
              type="number"
              inputMode="decimal"
              min={0}
              max={admissionFee}
              step="0.01"
              placeholder="0"
              value={discountText}
              onChange={(event) => setDiscountText(event.target.value)}
              error={discountError}
            />
            {validDiscount > 0 && (
              <Textarea
                label="Reason for discount"
                requiredMark
                rows={2}
                placeholder="e.g. Sibling already enrolled"
                value={discountReason}
                onChange={(event) => setDiscountReason(event.target.value)}
                error={reasonError}
              />
            )}
            {!discountError && finalAmount === 0 && (
              <p className="text-sm text-text-secondary">
                The whole admit fee is discounted — the enrollment is completed with
                no payment and no receipt.
              </p>
            )}

            {finalAmount > 0 && <PaymentMethodSelector value={method} onChange={setMethod} />}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep("bills")}>
                ← Back
              </Button>
              <Button
                onClick={handleEnrollAndPay}
                isLoading={enrollAndPay.isPending}
                disabled={Boolean(discountError || reasonError)}
              >
                {finalAmount > 0 ? "Confirm Payment & Enroll" : "Confirm & Enroll"}
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
              The enrollment month is settled. Pick any months the patient is paying
              for now, at the monthly fee. Months left unticked are simply not
              billed until they arrive.
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

        {step === "receipt" && enrollment && selectedPatient && selectedService && (
          <div className="flex flex-col gap-4">
            {receipts.length === 0 && (
              <p className="rounded-lg border border-border bg-background p-4 text-sm text-text-primary">
                {selectedPatient.name} is enrolled in {selectedService.name}. The admit
                fee was fully discounted, so no payment was taken and there is no
                receipt.
              </p>
            )}
            {/* Stacked rather than merged: one receipt per month is what
                makes an advance auditable month by month, and a combined
                receipt would name a month nobody was actually billed for. */}
            {receipts.length > 0 && (
              <div className="flex max-h-[26rem] flex-col gap-4 overflow-y-auto">
                {receipts.map((one) => (
                  <Receipt
                    key={one.id}
                    payment={one}
                    patientName={selectedPatient.name}
                    serviceName={selectedService.name}
                    branchName={branchName}
                  />
                ))}
              </div>
            )}
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
