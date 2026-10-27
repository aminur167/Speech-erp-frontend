"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Stepper } from "@/components/ui/Stepper";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { ServiceCard } from "@/components/services/ServiceCard";
import { PatientSearchInput } from "@/components/patients/PatientSearchInput";
import { PatientSearchResultList } from "@/components/patients/PatientSearchResultList";
import { PaymentMethodSelector } from "@/components/payments/PaymentMethodSelector";
import { DiscountFields } from "@/components/payments/DiscountFields";
import { Receipt } from "@/components/payments/Receipt";
import { useServices } from "@/hooks/services/useServices";
import { usePatients } from "@/hooks/patients/usePatients";
import { useCreateBooking } from "@/hooks/enrollments/useCreateBooking";
import { useDiscount } from "@/hooks/useDiscount";
import { useCurrentBranchName } from "@/hooks/branches/useCurrentBranchName";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/currency";
import { formatTimeLabel } from "@/utils/time";
import { generateIdempotencyKey } from "@/lib/offline/idempotency";
import type { Patient, Service, PaymentMethod, Payment, Booking } from "@/types/domain";

type Step = "service" | "patient" | "datetime" | "confirmation" | "receipt";

const STEP_ORDER: Step[] = ["service", "patient", "datetime", "confirmation", "receipt"];
const STEP_LABELS: Record<Step, string> = {
  service: "Select Service",
  patient: "Search Patient",
  datetime: "Date, Time & Advance Payment",
  confirmation: "Booking Confirmation",
  receipt: "Receipt",
};

/** Clinic's online-session booking window — the time input is constrained to this range. */
const BOOKING_TIME_RANGE = { min: "10:00", max: "18:00" };
const BOOKING_TIME_RANGE_LABEL = "10:00 AM – 6:00 PM";
/**
 * What the advance field starts at. Only a suggestion now: the manager
 * decides how much of the fee to take today, and the server accepts their
 * figure (backend docs/12-discounts.md). Kept in step with
 * BOOKING_ADVANCE_RATIO, which is still what the server falls back to when
 * no advance is sent — the public website booking path.
 */
const SUGGESTED_ADVANCE_RATIO = 0.5;

export function OnlineServiceEnrollment() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const branchName = useCurrentBranchName();
  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("online_payment");
  const [payment, setPayment] = useState<Payment | null>(null);
  // Kept as text so a half-typed "12." is not rewritten mid-keystroke, the
  // same reason useDiscount holds its amount as text.
  const [advanceText, setAdvanceText] = useState("");

  const { data: services, isLoading: servicesLoading } = useServices("online");
  const { data: patientResults, isLoading: patientsLoading } = usePatients({
    search,
    pageSize: 5,
  });
  const createBooking = useCreateBooking();

  const fee = selectedService?.fee ?? 0;
  // The discount comes off the fee; the advance is then taken against what
  // is left. A fee discounted to nothing is allowed here (unlike a daily
  // session) because the Booking row records the session either way.
  const discount = useDiscount({ charge: fee, what: "session fee" });
  const suggestedAdvance =
    Math.round(discount.net * SUGGESTED_ADVANCE_RATIO * 100) / 100;
  // Untouched field means "take the suggestion" -- and it re-suggests as the
  // discount changes, instead of stranding half of the old price in the box.
  const advance = advanceText.trim() === "" ? suggestedAdvance : Number(advanceText);

  let advanceError: string | undefined;
  if (!Number.isFinite(advance) || advance < 0) {
    advanceError = "Enter an advance of 0 or more.";
  } else if (advance > discount.net) {
    advanceError = `The advance cannot be more than the session fee (${formatCurrency(
      discount.net,
    )}).`;
  }

  const canBook = Boolean(date) && Boolean(time) && discount.isValid && !advanceError;

  const stepIndex = STEP_ORDER.indexOf(step);

  // One atomic call: the backend creates the booking and takes its advance
  // together -- this used to be two separate requests (create booking, then
  // pay it), which could leave a booking confirmed with no advance ever
  // collected. The advance sent is the manager's; the fee is never sent.
  const handleCreateBooking = () => {
    // `time` spelled out rather than folded into `canBook`: a boolean does
    // not narrow `string | null` for the request body below.
    if (!selectedService || !selectedPatient || !user || !date || !time) return;
    if (!canBook) return;
    createBooking.mutate(
      {
        patientId: selectedPatient.id,
        serviceId: selectedService.id,
        date,
        // Raw 24-hour "HH:MM" from the native time input -- the backend's
        // _validate_booking_slot() parses this with int(hour):int(minute)
        // and rejects anything else (including the 12-hour "2:30 PM" label
        // formatTimeLabel() produces for display). That mismatch used to
        // make every real booking fail server-side; formatTimeLabel() is
        // now only ever used for what's shown on screen, never sent.
        time,
        method,
        advanceAmount: advance,
        ...discount.payload,
        idempotencyKey: generateIdempotencyKey(),
      },
      {
        onSuccess: ({ booking: created, payment: createdPayment }) => {
          setBooking(created);
          setPayment(createdPayment);
          setStep("confirmation");
        },
      },
    );
  };

  const reset = () => {
    setStep("service");
    setSelectedService(null);
    setSearch("");
    setSelectedPatient(null);
    setDate("");
    setTime(null);
    setBooking(null);
    setMethod("online_payment");
    setPayment(null);
    setAdvanceText("");
    discount.reset();
  };

  return (
    <div className="flex flex-col gap-6">
      <Stepper steps={STEP_ORDER.map((s) => STEP_LABELS[s])} currentIndex={stepIndex} />

      <Card>
        {step === "service" && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-text-secondary">
              Choose an online service
            </h2>
            {servicesLoading && <LoadingState label="Loading services…" />}
            {!servicesLoading && (!services || services.length === 0) && (
              <EmptyState label="No online services available." />
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
                setStep("datetime");
              }}
            />
            <div>
              <Button variant="secondary" onClick={() => setStep("service")}>
                ← Back
              </Button>
            </div>
          </div>
        )}

        {step === "datetime" && selectedPatient && selectedService && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-text-secondary">Select date &amp; time</h2>
            <Input label="Booking date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-secondary">
                Preferred time{" "}
                <span className="font-normal text-text-secondary/70">
                  (available {BOOKING_TIME_RANGE_LABEL})
                </span>
              </label>
              <Input
                type="time"
                value={time ?? ""}
                onChange={(event) => setTime(event.target.value)}
                min={BOOKING_TIME_RANGE.min}
                max={BOOKING_TIME_RANGE.max}
              />
            </div>
            <DiscountFields
              discount={discount}
              max={fee}
              reasonPlaceholder="e.g. Follow-up session for an existing patient"
            />
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Session fee</span>
                <span className="font-medium text-text-primary">
                  {discount.value > 0 ? (
                    <>
                      <span className="mr-2 text-text-secondary/70 line-through">
                        {formatCurrency(fee)}
                      </span>
                      {formatCurrency(discount.net)}
                    </>
                  ) : (
                    formatCurrency(fee)
                  )}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-text-secondary">Remaining after this advance</span>
                <span className="font-medium text-text-primary">
                  {advanceError ? "—" : formatCurrency(Math.max(0, discount.net - advance))}
                </span>
              </div>
            </div>
            <Input
              label="Advance to collect now (৳)"
              type="number"
              inputMode="decimal"
              min={0}
              max={discount.net}
              step="0.01"
              placeholder={String(suggestedAdvance)}
              value={advanceText}
              onChange={(event) => setAdvanceText(event.target.value)}
              error={advanceError}
            />
            <PaymentMethodSelector value={method} onChange={setMethod} />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep("patient")}>
                ← Back
              </Button>
              <Button
                onClick={handleCreateBooking}
                disabled={!canBook}
                isLoading={createBooking.isPending}
              >
                {advance > 0 ? "Create Booking & Pay Advance" : "Create Booking"}
              </Button>
            </div>
          </div>
        )}

        {step === "confirmation" && booking && selectedService && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-text-secondary">Booking confirmed</h2>
            <div className="flex flex-col gap-2 rounded-lg border border-success/30 bg-success/5 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Booking ID</span>
                <span className="font-mono text-xs text-text-primary">{booking.bookingCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Service</span>
                <span className="font-medium text-text-primary">{selectedService.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Date &amp; Time</span>
                <span className="font-medium text-text-primary">
                  {booking.date} at {formatTimeLabel(booking.time)}
                </span>
              </div>
              <div className="flex justify-between border-t border-success/30 pt-2">
                <span className="text-text-secondary">Advance collected</span>
                <span className="font-medium text-text-primary">
                  {formatCurrency(booking.advanceAmount)}
                </span>
              </div>
              {booking.feeAmount != null && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Still to pay</span>
                  <span className="font-medium text-text-primary">
                    {formatCurrency(Math.max(0, booking.feeAmount - booking.advanceAmount))}
                  </span>
                </div>
              )}
            </div>
            {/* No advance taken means no payment and so no receipt to print.
                The booking stands; the desk can take the advance later from
                the bookings list, the same as a website booking. */}
            {payment ? (
              <div>
                <Button onClick={() => setStep("receipt")}>View Receipt</Button>
              </div>
            ) : (
              <>
                <p className="text-xs text-text-secondary">
                  No advance was collected, so there is no receipt for this booking
                  yet. Collect it from the bookings list when the patient pays.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => router.push("/manager/dashboard")}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Go to Dashboard
                  </Button>
                  <Button onClick={reset}>Start New Booking</Button>
                </div>
              </>
            )}
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
              <Button onClick={reset}>Start New Booking</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
