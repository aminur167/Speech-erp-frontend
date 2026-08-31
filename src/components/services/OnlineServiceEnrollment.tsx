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
import { Receipt } from "@/components/payments/Receipt";
import { useServices } from "@/hooks/services/useServices";
import { usePatients } from "@/hooks/patients/usePatients";
import { useCreateBooking } from "@/hooks/enrollments/useCreateBooking";
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
const ADVANCE_RATIO = 0.5;

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

  const { data: services, isLoading: servicesLoading } = useServices("online");
  const { data: patientResults, isLoading: patientsLoading } = usePatients({
    search,
    pageSize: 5,
  });
  const createBooking = useCreateBooking();

  const stepIndex = STEP_ORDER.indexOf(step);

  // One atomic call: the backend creates the booking and charges its advance
  // together, computing the advance amount itself from the service fee --
  // this used to be two separate requests (create booking, then pay it),
  // which could leave a booking confirmed with no advance ever collected.
  const handleCreateBooking = () => {
    if (!selectedService || !selectedPatient || !user || !date || !time) return;
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
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
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
            <div className="flex justify-between rounded-lg border border-border bg-background p-4 text-sm">
              <span className="text-text-secondary">Advance Due (est. 50%)</span>
              <span className="text-lg font-semibold text-primary-dark">
                {formatCurrency(Math.round(selectedService.fee * ADVANCE_RATIO))}
              </span>
            </div>
            <PaymentMethodSelector value={method} onChange={setMethod} />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep("patient")}>
                ← Back
              </Button>
              <Button
                onClick={handleCreateBooking}
                disabled={!date || !time}
                isLoading={createBooking.isPending}
              >
                Create Booking &amp; Pay Advance
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
            </div>
            <div>
              <Button onClick={() => setStep("receipt")}>View Receipt</Button>
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
              <Button onClick={reset}>Start New Booking</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
