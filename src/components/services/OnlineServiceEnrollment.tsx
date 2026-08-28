"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Stepper } from "@/components/ui/Stepper";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { ServiceCard } from "@/components/services/ServiceCard";
import { PatientSearchInput } from "@/components/patients/PatientSearchInput";
import { PaymentMethodSelector } from "@/components/payments/PaymentMethodSelector";
import { Receipt } from "@/components/payments/Receipt";
import { useServices } from "@/hooks/services/useServices";
import { usePatients } from "@/hooks/patients/usePatients";
import { useCreatePayment } from "@/hooks/payments/useCreatePayment";
import { useCreateBooking } from "@/hooks/enrollments/useCreateBooking";
import { useCurrentBranchName } from "@/hooks/branches/useCurrentBranchName";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/currency";
import type { Patient, Service, PaymentMethod, Payment, Booking } from "@/types/domain";

type Step = "service" | "patient" | "datetime" | "payment" | "confirmation" | "receipt";

const STEP_ORDER: Step[] = [
  "service",
  "patient",
  "datetime",
  "payment",
  "confirmation",
  "receipt",
];
const STEP_LABELS: Record<Step, string> = {
  service: "Select Service",
  patient: "Search Patient",
  datetime: "Select Date & Time",
  payment: "Advance Payment",
  confirmation: "Booking Confirmation",
  receipt: "Receipt",
};

/** Clinic's online-session booking window — the time input is constrained to this range. */
const BOOKING_TIME_RANGE = { min: "10:00", max: "18:00" };
const BOOKING_TIME_RANGE_LABEL = "10:00 AM – 6:00 PM";
const ADVANCE_RATIO = 0.5;

/** Converts a native time-input value ("HH:MM", 24-hour) into a friendly 12-hour label. */
function formatTimeLabel(value: string): string {
  const [hourStr, minuteStr] = value.split(":");
  const hour = Number(hourStr);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minuteStr} ${period}`;
}

export function OnlineServiceEnrollment() {
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
  const createPayment = useCreatePayment();

  const stepIndex = STEP_ORDER.indexOf(step);

  const handleCreateBooking = () => {
    if (!selectedService || !selectedPatient || !user || !date || !time) return;
    const advanceAmount = Math.round(selectedService.fee * ADVANCE_RATIO);
    createBooking.mutate(
      {
        patientId: selectedPatient.id,
        serviceId: selectedService.id,
        branchId: user.branchId ?? "branch-1",
        date,
        time: formatTimeLabel(time),
        advanceAmount,
      },
      {
        onSuccess: (created) => {
          setBooking(created);
          setStep("payment");
        },
      },
    );
  };

  const handleAdvancePayment = () => {
    if (!selectedPatient || !user || !booking) return;
    createPayment.mutate(
      {
        patientId: selectedPatient.id,
        amount: booking.advanceAmount,
        method,
        category: "online",
        collectedBy: user.name,
        branchId: user.branchId ?? "branch-1",
      },
      {
        onSuccess: (createdPayment) => {
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
                    setStep("datetime");
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
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep("patient")}>
                ← Back
              </Button>
              <Button
                onClick={handleCreateBooking}
                disabled={!date || !time}
                isLoading={createBooking.isPending}
              >
                Create Booking
              </Button>
            </div>
          </div>
        )}

        {step === "payment" && selectedPatient && booking && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-text-secondary">Advance payment</h2>
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Booking</span>
                <span className="font-mono text-xs text-text-secondary">
                  {booking.bookingCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Date &amp; Time</span>
                <span className="font-medium text-text-primary">
                  {booking.date} at {booking.time}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-text-secondary">Advance Due (50%)</span>
                <span className="text-lg font-semibold text-primary-dark">
                  {formatCurrency(booking.advanceAmount)}
                </span>
              </div>
            </div>
            <PaymentMethodSelector value={method} onChange={setMethod} />
            <div>
              <Button onClick={handleAdvancePayment} isLoading={createPayment.isPending}>
                Pay Advance
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
                  {booking.date} at {booking.time}
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
            <div>
              <Button onClick={reset}>Start New Booking</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
