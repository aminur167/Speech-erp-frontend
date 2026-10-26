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
import { PatientSearchInput } from "@/components/patients/PatientSearchInput";
import { PatientSearchResultList } from "@/components/patients/PatientSearchResultList";
import { PaymentMethodSelector } from "@/components/payments/PaymentMethodSelector";
import { PaymentSummary } from "@/components/payments/PaymentSummary";
import { Receipt, type ReceiptLine } from "@/components/payments/Receipt";
import { useServices } from "@/hooks/services/useServices";
import { usePatients } from "@/hooks/patients/usePatients";
import { useEnrollMonthly } from "@/hooks/enrollments/useCreateMonthlyEnrollment";
import { usePayMonthlyBill } from "@/hooks/enrollments/usePayMonthlyBill";
import { firstMonthBill } from "@/lib/api/monthlyEnrollments";
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
  | "payment"
  | "firstMonth"
  | "advance"
  | "receipt";

const STEP_ORDER: Step[] = [
  "service",
  "patient",
  "enroll",
  "payment",
  "firstMonth",
  "advance",
  "receipt",
];
const STEP_LABELS: Record<Step, string> = {
  service: "Select Service",
  patient: "Search Patient",
  enroll: "Create Enrollment",
  payment: "Admit Fee",
  firstMonth: "First Month",
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
  // The enrollment month's own discount. Collected on the same screen as the
  // admit fee's, because the server bills both months in the one enrolling
  // request -- only the collection of the month happens later.
  const [monthDiscountText, setMonthDiscountText] = useState("");
  const [monthDiscountReason, setMonthDiscountReason] = useState("");
  const [firstMonthPayment, setFirstMonthPayment] = useState<Payment | null>(null);
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
  const payFirstMonth = usePayMonthlyBill();
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
  const currentMonthLabel = monthKeyLabel(currentMonth);
  const admissionLabel = `Admission — ${currentMonthLabel}`;
  const admissionFee = selectedService?.admissionFee ?? selectedService?.fee ?? 0;
  const discount = discountText.trim() === "" ? 0 : Number(discountText);
  const validDiscount = Number.isFinite(discount) ? discount : 0;
  const finalAmount = Math.max(0, admissionFee - validDiscount);

  const monthlyFee = selectedService?.fee ?? 0;
  const monthDiscount =
    monthDiscountText.trim() === "" ? 0 : Number(monthDiscountText);
  const validMonthDiscount = Number.isFinite(monthDiscount) ? monthDiscount : 0;
  const firstMonthAmount = Math.max(0, monthlyFee - validMonthDiscount);

  let discountError: string | undefined;
  if (!Number.isFinite(discount) || discount < 0) {
    discountError = "Enter a discount of 0 or more.";
  } else if (discount > admissionFee) {
    discountError = `The discount cannot be more than the admit fee (${formatCurrency(admissionFee)}).`;
  }

  let monthDiscountError: string | undefined;
  if (!Number.isFinite(monthDiscount) || monthDiscount < 0) {
    monthDiscountError = "Enter a discount of 0 or more.";
  } else if (monthDiscount > monthlyFee) {
    monthDiscountError = `The discount cannot be more than the monthly fee (${formatCurrency(monthlyFee)}).`;
  }

  const monthReasonError =
    validMonthDiscount > 0 && !monthDiscountReason.trim()
      ? "Say why the discount is being given."
      : undefined;
  const reasonError =
    validDiscount > 0 && !discountReason.trim()
      ? "Say why the discount is being given."
      : undefined;

  const handleEnrollAndPay = () => {
    if (!selectedService || !selectedPatient || !user || discountError || reasonError) {
      return;
    }
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
          // The admit fee is settled; the month is billed and waiting. It is
          // its own step because the manager may take it now or leave it.
          setStep("firstMonth");
        },
      },
    );
  };

  const handleCollectFirstMonth = () => {
    const bill = enrollment ? firstMonthBill(enrollment) : null;
    if (!enrollment || !bill || monthDiscountError || monthReasonError) return;
    payFirstMonth.mutate(
      {
        enrollmentId: enrollment.id,
        billId: bill.id,
        method,
        discount: validMonthDiscount,
        discountReason: validMonthDiscount > 0 ? monthDiscountReason.trim() : "",
        idempotencyKey: generateIdempotencyKey(),
      },
      {
        onSuccess: ({ payment: collected, enrollment: updated }) => {
          setFirstMonthPayment(collected);
          setEnrollment(updated);
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
    setMonthDiscountText("");
    setMonthDiscountReason("");
    setFirstMonthPayment(null);
    setEnrollKey(null);
    setAdvanceMonths([]);
    setAdvancePayments([]);
  };

  // Every payment this enrollment produced, newest last. Each is its own
  // Payment in the ledger with its own receipt number; the receipt below
  // gathers them onto one page because they were one visit.
  const payments = [payment, firstMonthPayment, ...advancePayments].filter(
    (one): one is Payment => one !== null,
  );

  // One line per charge, in the order they were taken. The advance is a
  // single line standing for however many months were bought — the months
  // themselves are listed under it.
  const receiptLines: ReceiptLine[] = [
    ...(payment
      ? [
          {
            label: "Admit fee",
            amount: payment.amount,
            receiptNumber: payment.receiptNumber,
          },
        ]
      : []),
    ...(firstMonthPayment
      ? [
          {
            label: `Monthly fee (${currentMonthLabel})`,
            amount: firstMonthPayment.amount,
            receiptNumber: firstMonthPayment.receiptNumber,
          },
        ]
      : []),
    ...(advancePayments.length > 0
      ? [
          {
            label: "Advance fee",
            amount: advancePayments.reduce((sum, one) => sum + one.amount, 0),
            months: advanceMonths.map(monthKeyLabel),
          },
        ]
      : []),
  ];

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
              next step. The first month is billed at the same time and
              collected after it — or left for later.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep("patient")}>
                ← Back
              </Button>
              <Button onClick={() => setStep("payment")} disabled={outstandingTotal > 0}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === "payment" && selectedPatient && selectedService && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-text-secondary">
              Collect the admit fee — {admissionLabel}
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
                <span className="font-medium text-text-primary">Paying now</span>
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
              <Button variant="secondary" onClick={() => setStep("enroll")}>
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

        {step === "firstMonth" && enrollment && selectedService && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-text-secondary">
              Collect {currentMonthLabel} — optional
            </h2>
            <p className="text-sm text-text-primary">
              The admit fee is settled and the patient is enrolled. This month
              is billed and still owed.
            </p>

            <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Monthly Fee</span>
                <span className="tabular-nums text-text-primary">
                  {formatCurrency(monthlyFee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Discount</span>
                <span className="tabular-nums text-text-primary">
                  −{" "}
                  {formatCurrency(
                    validMonthDiscount > 0 && !monthDiscountError ? validMonthDiscount : 0,
                  )}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-medium text-text-primary">Paying now</span>
                <span className="text-lg font-semibold tabular-nums text-primary-dark">
                  {formatCurrency(monthDiscountError ? monthlyFee : firstMonthAmount)}
                </span>
              </div>
            </div>

            <Input
              label="Discount (৳)"
              type="number"
              inputMode="decimal"
              min={0}
              max={monthlyFee}
              step="0.01"
              placeholder="0"
              value={monthDiscountText}
              onChange={(event) => setMonthDiscountText(event.target.value)}
              error={monthDiscountError}
            />
            {validMonthDiscount > 0 && (
              <Textarea
                label="Reason for discount"
                requiredMark
                rows={2}
                placeholder="e.g. Joined mid-month"
                value={monthDiscountReason}
                onChange={(event) => setMonthDiscountReason(event.target.value)}
                error={monthReasonError}
              />
            )}
            {!monthDiscountError && firstMonthAmount === 0 && (
              <p className="text-sm text-text-secondary">
                The whole month is discounted — it is settled with no payment
                and no receipt line.
              </p>
            )}

            {firstMonthAmount > 0 && (
              <PaymentMethodSelector value={method} onChange={setMethod} />
            )}

            <div className="flex gap-2">
              {/* Skipping is simply not collecting it — there is no second
                  request. The month stays owed and shows up on Due Payments,
                  which also means the advance step stays shut: arrears block
                  future months. */}
              <Button variant="secondary" onClick={() => setStep("receipt")}>
                Collect later
              </Button>
              <Button
                onClick={handleCollectFirstMonth}
                isLoading={payFirstMonth.isPending}
                disabled={Boolean(monthDiscountError || monthReasonError)}
              >
                {firstMonthAmount > 0
                  ? `Collect ${formatCurrency(firstMonthAmount)}`
                  : "Settle with no payment"}
              </Button>
            </div>
            <p className="text-xs text-text-secondary">
              Left uncollected, {currentMonthLabel} moves to Due Payment
              Collection, and advance months cannot be taken until it is
              cleared.
            </p>
          </div>
        )}

        {step === "advance" && enrollment && selectedService && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-text-secondary">
              Advance Payment — optional
            </h2>
            <p className="text-sm text-text-primary">
              Everything owed so far is settled. Pick any months the patient is
              paying for now, at the monthly fee. Months left unticked are
              simply not billed until they arrive.
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
            {payments.length === 0 && (
              <p className="rounded-lg border border-border bg-background p-4 text-sm text-text-primary">
                {selectedPatient.name} is enrolled in {selectedService.name}.
                Everything due was discounted away, so no payment was taken and
                there is no receipt.
              </p>
            )}
            {/* One receipt, however many payments it took. They were one
                visit, and handing a patient three slips for it is how a desk
                ends up reconciling three things that were always one. Each
                line still carries its own receipt number, because each is
                still its own Payment in the ledger. */}
            {payments.length > 0 && (
              <Receipt
                payment={payments[0]}
                patientName={selectedPatient.name}
                serviceName={selectedService.name}
                branchName={branchName}
                lines={receiptLines}
              />
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
