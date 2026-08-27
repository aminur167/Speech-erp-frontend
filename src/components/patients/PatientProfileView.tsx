"use client";

import { Card } from "@/components/ui/Card";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/states";
import { usePatient } from "@/hooks/patients/usePatient";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-text-secondary">{label}</dt>
      <dd className="text-sm text-text-primary">{value}</dd>
    </div>
  );
}

export function PatientProfileView({ patientId }: { patientId: string }) {
  const { data: patient, isLoading, isError, refetch } = usePatient(patientId);

  if (isLoading) return <LoadingState label="Loading patient…" />;
  if (isError || !patient) {
    return <ErrorState label="Patient not found." onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">{patient.name}</h1>
        <p className="font-mono text-sm text-text-secondary">{patient.patientCode}</p>
      </div>

      <Card>
        <h2 className="text-sm font-medium text-text-secondary">Patient Information</h2>
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          <Field label="Phone" value={patient.phone} />
          <Field label="Email" value={patient.email || "—"} />
          <Field label="Gender" value={patient.gender ?? "—"} />
          <Field label="Date of Birth" value={patient.dateOfBirth ?? "—"} />
          <Field label="Guardian" value={patient.guardianName || "—"} />
          <Field label="Address" value={patient.address || "—"} />
        </dl>
      </Card>

      <Card>
        <h2 className="text-sm font-medium text-text-secondary">Active Services</h2>
        <div className="mt-3">
          <EmptyState label="No active services yet." />
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-medium text-text-secondary">Payment History</h2>
        <div className="mt-3">
          <EmptyState label="No payment history yet." />
        </div>
      </Card>
    </div>
  );
}
