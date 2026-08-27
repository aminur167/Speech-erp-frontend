"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/states";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ScheduleList } from "@/components/services/ScheduleList";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { Pagination } from "@/components/ui/Pagination";
import { usePatient } from "@/hooks/patients/usePatient";
import { usePatientActiveServices } from "@/hooks/patients/usePatientActiveServices";
import { useTransactions } from "@/hooks/transactions/useTransactions";
import { formatCurrency } from "@/utils/currency";

const PAGE_SIZE = 5;

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-text-secondary">{label}</dt>
      <dd className="text-sm text-text-primary">{value}</dd>
    </div>
  );
}

export function PatientProfileView({
  patientId,
  homeHref,
  roleLabel,
}: {
  patientId: string;
  homeHref: string;
  roleLabel: string;
}) {
  const { data: patient, isLoading, isError, refetch } = usePatient(patientId);
  const { data: activeServices, isLoading: servicesLoading } =
    usePatientActiveServices(patientId);
  const [page, setPage] = useState(1);
  const { data: transactions, isLoading: transactionsLoading } = useTransactions({
    patientId,
    page,
    pageSize: PAGE_SIZE,
  });

  if (isLoading) return <LoadingState label="Loading patient…" />;
  if (isError || !patient) {
    return <ErrorState label="Patient not found." onRetry={() => refetch()} />;
  }

  const hasActiveServices = Boolean(activeServices?.monthly || activeServices?.installment);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 border-b border-border pb-5">
        <Breadcrumb homeHref={homeHref} items={[roleLabel, "Patients", patient.name]} />
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">{patient.name}</h1>
          <p className="mt-1 font-mono text-sm text-text-secondary">{patient.patientCode}</p>
        </div>
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
        <div className="mt-3 flex flex-col gap-5">
          {servicesLoading && <LoadingState label="Loading services…" />}
          {!servicesLoading && !hasActiveServices && (
            <EmptyState label="No active services yet." />
          )}
          {!servicesLoading && activeServices?.monthly && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-text-primary">
                {activeServices.monthly.serviceName}{" "}
                <span className="font-normal text-text-secondary">(Monthly)</span>
              </p>
              <ScheduleList
                items={activeServices.monthly.enrollment.bills.map((bill) => ({
                  key: bill.month,
                  label: bill.label,
                  amount: bill.amount,
                  status: bill.status,
                }))}
              />
            </div>
          )}
          {!servicesLoading && activeServices?.installment && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-text-primary">
                {activeServices.installment.serviceName}{" "}
                <span className="font-normal text-text-secondary">
                  (Installment — Total: {formatCurrency(activeServices.installment.plan.totalAmount)})
                </span>
              </p>
              <ScheduleList
                items={activeServices.installment.plan.installments.map((installment) => ({
                  key: String(installment.index),
                  label: installment.label,
                  amount: installment.amount,
                  status: installment.status,
                }))}
              />
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-medium text-text-secondary">Payment History</h2>
        <div className="mt-3">
          {transactionsLoading && <LoadingState label="Loading payment history…" />}
          {!transactionsLoading && transactions?.results.length === 0 && (
            <EmptyState label="No payment history yet." />
          )}
          {!transactionsLoading && transactions && transactions.results.length > 0 && (
            <>
              <TransactionTable transactions={transactions.results} />
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                count={transactions.count}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
