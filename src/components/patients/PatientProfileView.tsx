"use client";

import { useState } from "react";
import {
  Phone,
  Mail,
  Cake,
  MapPin,
  UserRound,
  CalendarPlus,
  Droplet,
  PhoneCall,
  Users,
  IdCard,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/states";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { OverdueBadge } from "@/components/patients/OverdueBadge";
import { ScheduleList } from "@/components/services/ScheduleList";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { Pagination } from "@/components/ui/Pagination";
import { usePatient } from "@/hooks/patients/usePatient";
import { usePatientActiveServices } from "@/hooks/patients/usePatientActiveServices";
import { useTransactions } from "@/hooks/transactions/useTransactions";
import { useBranches } from "@/hooks/branches/useBranches";
import { calculateAge } from "@/lib/api/patientDirectory";
import { formatCurrency } from "@/utils/currency";
import type { PatientCareStatus } from "@/lib/api/patientDirectory";

const PAYMENT_PAGE_SIZE = 5;
const SERVICES_PAGE_SIZE = 3;

const statusTone: Record<PatientCareStatus, "success" | "purple" | "warning"> = {
  "active-care": "success",
  "in-progress": "purple",
  "action-needed": "warning",
};

const statusLabel: Record<PatientCareStatus, string> = {
  "active-care": "Active Care",
  "in-progress": "In Progress",
  "action-needed": "Action Needed",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function InfoItem({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary-dark">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-text-secondary">{label}</p>
        <p className="truncate text-sm font-medium text-text-primary">{value}</p>
      </div>
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
  const { data: branches } = useBranches();
  const [servicePage, setServicePage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const { data: transactions, isLoading: transactionsLoading } = useTransactions({
    patientId,
    page: paymentPage,
    pageSize: PAYMENT_PAGE_SIZE,
  });

  if (isLoading) return <LoadingState label="Loading patient…" />;
  if (isError || !patient) {
    return <ErrorState label="Patient not found." onRetry={() => refetch()} />;
  }

  const age = calculateAge(patient.dateOfBirth);
  const branchName = branches?.find((b) => b.id === patient.branchId)?.name ?? patient.branchId;

  const services = activeServices ?? [];
  const hasMonthly = services.some((s) => s.type === "monthly");
  const hasInstallment = services.some((s) => s.type === "installment");
  const careStatus: PatientCareStatus = hasMonthly
    ? "active-care"
    : hasInstallment
      ? "in-progress"
      : "action-needed";

  const serviceStart = (servicePage - 1) * SERVICES_PAGE_SIZE;
  const pagedServices = services.slice(serviceStart, serviceStart + SERVICES_PAGE_SIZE);

  const guardianValue = patient.guardianName
    ? `${patient.guardianName}${patient.guardianRelation ? ` (${patient.guardianRelation})` : ""}`
    : "—";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 border-b border-border pb-5">
        <Breadcrumb homeHref={homeHref} items={[roleLabel, "Patients", patient.name]} />
      </div>

      <Card>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-light text-xl font-semibold text-primary-dark">
              {getInitials(patient.name)}
            </span>
            <div>
              <h1 className="text-2xl font-semibold text-text-primary">{patient.name}</h1>
              <p className="mt-0.5 font-mono text-sm text-text-secondary">{patient.patientCode}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge tone={statusTone[careStatus]} label={statusLabel[careStatus]} />
                {patient.serviceStatus === "overdue" && <OverdueBadge />}
                {patient.gender && <Badge tone="neutral" label={patient.gender} />}
                {age != null && <Badge tone="neutral" label={`${age} yrs`} />}
              </div>
              {patient.serviceStatus === "overdue" && (
                <p className="mt-2 text-sm text-danger">
                  {formatCurrency(patient.overdueAmount)} overdue
                  {patient.overdueSince &&
                    ` since ${new Date(patient.overdueSince).toLocaleDateString()}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-6 sm:flex-col sm:items-end sm:gap-3">
            <div className="text-left sm:text-right">
              <p className="text-xs text-text-secondary">Branch</p>
              <p className="text-sm font-medium text-text-primary">{branchName}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-text-secondary">Registered</p>
              <p className="text-sm font-medium text-text-primary">
                {new Date(patient.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem icon={Phone} label="Phone" value={patient.phone} />
          <InfoItem icon={Mail} label="Email" value={patient.email || "—"} />
          <InfoItem icon={Cake} label="Date of Birth" value={patient.dateOfBirth ?? "—"} />
          <InfoItem icon={UserRound} label="Guardian" value={guardianValue} />
          <InfoItem icon={MapPin} label="Address" value={patient.address || "—"} />
          <InfoItem icon={Droplet} label="Blood Group" value={patient.bloodGroup || "—"} />
          <InfoItem
            icon={PhoneCall}
            label="Emergency Contact"
            value={patient.emergencyContact || "—"}
          />
          <InfoItem icon={Users} label="Referred By" value={patient.referredBy || "—"} />
          <InfoItem icon={IdCard} label="National ID" value={patient.nationalId || "—"} />
          <InfoItem
            icon={CalendarPlus}
            label="Patient Since"
            value={new Date(patient.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          />
        </div>

        {(patient.chiefComplaint || patient.notes) && (
          <div className="mt-4 grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2">
            {patient.chiefComplaint && (
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary-dark">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-text-secondary">Chief Complaint</p>
                  <p className="text-sm text-text-primary">{patient.chiefComplaint}</p>
                </div>
              </div>
            )}
            {patient.notes && (
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary-dark">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-text-secondary">Notes</p>
                  <p className="text-sm text-text-primary">{patient.notes}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-medium text-text-secondary">Active Services</h2>
        <div className="mt-3 flex flex-col gap-5">
          {servicesLoading && <LoadingState label="Loading services…" />}
          {!servicesLoading && services.length === 0 && (
            <EmptyState label="No active services yet." />
          )}
          {!servicesLoading &&
            pagedServices.map((item) => (
              <div key={item.id} className="flex flex-col gap-2">
                <p className="text-sm font-medium text-text-primary">
                  {item.serviceName}{" "}
                  <span className="font-normal text-text-secondary">
                    {item.type === "monthly"
                      ? "(Monthly)"
                      : `(Installment — Total: ${formatCurrency(item.plan.totalAmount)})`}
                  </span>
                </p>
                <ScheduleList
                  items={
                    item.type === "monthly"
                      ? item.enrollment.bills.map((bill) => ({
                          key: bill.month,
                          label: bill.label,
                          amount: bill.amount,
                          amountPaid: bill.amountPaid,
                          outstanding: bill.outstanding,
                          status: bill.status,
                        }))
                      : item.plan.installments.map((installment) => ({
                          key: String(installment.index),
                          label: installment.label,
                          amount: installment.amount,
                          amountPaid: installment.amountPaid,
                          outstanding: installment.outstanding,
                          status: installment.status,
                        }))
                  }
                />
              </div>
            ))}
          {!servicesLoading && services.length > 0 && (
            <Pagination
              page={servicePage}
              pageSize={SERVICES_PAGE_SIZE}
              count={services.length}
              onPageChange={setServicePage}
            />
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
                page={paymentPage}
                pageSize={PAYMENT_PAGE_SIZE}
                count={transactions.count}
                onPageChange={setPaymentPage}
              />
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
