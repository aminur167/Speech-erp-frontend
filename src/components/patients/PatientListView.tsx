"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, HeartPulse, Activity, ClipboardList, RefreshCw, Download } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { ColumnsMenu } from "@/components/ui/ColumnsMenu";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/states";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { BranchFilterSelect } from "@/components/ui/BranchFilterSelect";
import { FilterBar, FILTER_FIELD_WIDTH } from "@/components/ui/FilterBar";
import { SearchField } from "@/components/ui/SearchField";
import { PatientTable, type PatientTableColumns } from "@/components/patients/PatientTable";
import { PatientRegistrationForm } from "@/components/patients/PatientRegistrationForm";
import { usePatientDirectory } from "@/hooks/patients/usePatientDirectory";
import { usePatientDirectorySummary } from "@/hooks/patients/usePatientDirectorySummary";
import { useAuthStore } from "@/store/authStore";
import { exportToCsv } from "@/utils/exportCsv";
import { PAYMENT_METHOD_OPTIONS } from "@/utils/paymentMethod";
import { toLocalDateString } from "@/utils/time";
import type {
  PatientCareStatus,
  PatientDirectoryItem,
  PatientTimeRange,
} from "@/lib/api/patientDirectory";
import type { Gender, PaymentMethod, ServiceCategory } from "@/types/domain";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PatientEditForm } from "@/components/patients/PatientEditForm";
import { usePatient } from "@/hooks/patients/usePatient";
import { useDeletePatient } from "@/hooks/patients/useDeletePatient";

const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  daily: "Daily Services",
  monthly: "Monthly Services",
  installment: "Installment Services",
  online: "Online Services",
};

const PAGE_SIZE = 10;

const DEFAULT_COLUMNS: PatientTableColumns = {
  age: true,
  gender: true,
  guardian: true,
  phone: true,
  therapyType: true,
  serviceType: true,
  paymentType: true,
  status: true,
  branch: true,
};

export function PatientListView({
  basePath,
  branchId: branchIdOverride,
}: {
  basePath: string;
  /** Scopes the view to one branch regardless of role — used when Admin is browsing a specific branch. */
  branchId?: string;
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const canRegister = user?.role === "manager";
  const isAdmin = user?.role === "admin";
  const canPickBranch = isAdmin && !branchIdOverride;
  // Editing needs the full record; the directory row carries only a summary.
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<PatientDirectoryItem | null>(null);
  const { data: editingPatient, isLoading: editingLoading } = usePatient(editingPatientId ?? "");
  const deletePatient = useDeletePatient();
  const [selectedBranch, setSelectedBranch] = useState("");
  const branchId =
    branchIdOverride ?? (isAdmin ? selectedBranch || undefined : (user?.branchId ?? undefined));

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PatientCareStatus | "">("");
  const [gender, setGender] = useState<Gender | "">("");
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory | "">("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [timeRange, setTimeRange] = useState<PatientTimeRange>("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [columns, setColumns] = useState<PatientTableColumns>(DEFAULT_COLUMNS);

  const { data, isLoading, isFetching, isError, refetch } = usePatientDirectory({
    search,
    status: statusFilter || undefined,
    gender: gender || undefined,
    serviceCategory: serviceCategory || undefined,
    paymentType: paymentMethod || undefined,
    timeRange: timeRange || undefined,
    date: date || undefined,
    branchId,
    page,
    pageSize: PAGE_SIZE,
  });
  const { data: summary } = usePatientDirectorySummary(branchId);

  const hasFilters = Boolean(
    search ||
      statusFilter ||
      gender ||
      serviceCategory ||
      paymentMethod ||
      timeRange ||
      date ||
      selectedBranch,
  );

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setGender("");
    setServiceCategory("");
    setPaymentMethod("");
    setTimeRange("");
    setDate("");
    setSelectedBranch("");
    setPage(1);
  };

  const toggleStatCard = (value: PatientCareStatus) => {
    setStatusFilter((current) => (current === value ? "" : value));
    setPage(1);
  };

  const handleExport = () => {
    exportToCsv(
      "patients.csv",
      (data?.results ?? []).map((patient) => ({
        "Patient ID": patient.patientCode,
        Name: patient.name,
        Age: patient.age ?? "",
        Gender: patient.gender ?? "",
        Guardian: patient.guardianName ?? "",
        Phone: patient.phone,
        Branch: patient.branchName,
        "Therapy Type": patient.therapyType,
        "Service Type": patient.serviceCategories
          .map((category) => SERVICE_CATEGORY_LABELS[category])
          .join(", "),
        "Payment Type": patient.paymentType,
        Status: patient.status,
      })),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Patient Management"
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleExport}
              disabled={!data || data.results.length === 0}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            {canRegister && (
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Register Patient
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="All Patients"
          value={String(summary?.total ?? 0)}
          icon={Users}
          tone="primary"
          hint={branchId ? "For this branch" : "Across all branches"}
          selected={statusFilter === ""}
          onClick={() => {
            setStatusFilter("");
            setPage(1);
          }}
        />
        <StatCard
          label="Active Care"
          value={String(summary?.activeCare ?? 0)}
          icon={HeartPulse}
          tone="success"
          hint="Currently in monthly treatment"
          selected={statusFilter === "active-care"}
          onClick={() => toggleStatCard("active-care")}
        />
        <StatCard
          label="In Progress"
          value={String(summary?.inProgress ?? 0)}
          icon={Activity}
          tone="purple"
          hint="On an installment plan"
          selected={statusFilter === "in-progress"}
          onClick={() => toggleStatCard("in-progress")}
        />
        <StatCard
          label="Action Needed"
          value={String(summary?.actionNeeded ?? 0)}
          icon={ClipboardList}
          tone="warning"
          hint="Not yet enrolled in a service"
          selected={statusFilter === "action-needed"}
          onClick={() => toggleStatCard("action-needed")}
        />
      </div>

      <FilterBar
        search={
          <SearchField
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search name, phone, patient ID or guardian"
          />
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label="Refresh"
              title="Refresh"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-primary/40 hover:bg-primary-light/60 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={clsx("h-4 w-4", isFetching && "animate-spin")} />
            </button>
            <ColumnsMenu
              options={[
                { key: "age", label: "Age" },
                { key: "gender", label: "Gender" },
                { key: "guardian", label: "Guardian" },
                { key: "phone", label: "Phone" },
                { key: "therapyType", label: "Therapy Type" },
                { key: "serviceType", label: "Service Type" },
                { key: "paymentType", label: "Payment Type" },
                { key: "status", label: "Status" },
                { key: "branch", label: "Branch" },
              ]}
              visible={columns}
              onToggle={(key) =>
                setColumns((prev) => ({
                  ...prev,
                  [key]: !prev[key as keyof PatientTableColumns],
                }))
              }
            />
          </>
        }
        dateSlot={
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setTimeRange("");
              setPage(1);
            }}
            containerClassName={FILTER_FIELD_WIDTH}
            max={toLocalDateString()}
          />
        }
      >
        {canPickBranch && (
          <BranchFilterSelect
            value={selectedBranch}
            onChange={(value) => {
              setSelectedBranch(value);
              setPage(1);
            }}
          />
        )}
        <Select
          label="Gender"
          value={gender}
          onChange={(event) => {
            setGender(event.target.value as Gender | "");
            setPage(1);
          }}
          containerClassName={FILTER_FIELD_WIDTH}
        >
          <option value="">All genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </Select>
        <Select
          label="Service Type"
          value={serviceCategory}
          onChange={(event) => {
            setServiceCategory(event.target.value as ServiceCategory | "");
            setPage(1);
          }}
          containerClassName={FILTER_FIELD_WIDTH}
        >
          <option value="">All service types</option>
          {(Object.keys(SERVICE_CATEGORY_LABELS) as ServiceCategory[]).map((category) => (
            <option key={category} value={category}>
              {SERVICE_CATEGORY_LABELS[category]}
            </option>
          ))}
        </Select>
        <Select
          label="Payment Type"
          value={paymentMethod}
          onChange={(event) => {
            setPaymentMethod(event.target.value as PaymentMethod | "");
            setPage(1);
          }}
          containerClassName={FILTER_FIELD_WIDTH}
        >
          <option value="">All payment types</option>
          {PAYMENT_METHOD_OPTIONS.map((method) => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </Select>
        <Select
          label="Period"
          value={timeRange}
          onChange={(event) => {
            setTimeRange(event.target.value as PatientTimeRange);
            setDate("");
            setPage(1);
          }}
          containerClassName={FILTER_FIELD_WIDTH}
        >
          <option value="">All time</option>
          <option value="today">Today</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
        </Select>
        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="shrink-0 pb-2 text-sm font-medium text-primary hover:underline"
          >
            Reset
          </button>
        )}
      </FilterBar>

      <Card>
        <div className="flex flex-col gap-4">
          {isLoading && <LoadingState label="Loading patients…" />}
          {isError && <ErrorState onRetry={() => refetch()} />}
          {!isLoading && !isError && data?.results.length === 0 && (
            <EmptyState label="No patients found." />
          )}
          {!isLoading && !isError && data && data.results.length > 0 && (
            <>
              <PatientTable
                patients={data.results}
                basePath={basePath}
                columns={columns}
                onEdit={(patient) => setEditingPatientId(patient.id)}
                onDelete={setDeletingPatient}
              />
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                count={data.count}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </Card>

      <Modal
        open={Boolean(editingPatientId)}
        onClose={() => setEditingPatientId(null)}
        title="Edit Patient"
        description="Update the patient's details below."
        className="max-w-2xl"
        dismissible={false}
      >
        {editingLoading && <LoadingState label="Loading patient…" />}
        {editingPatient && (
          <PatientEditForm
            patient={editingPatient}
            onSuccess={() => setEditingPatientId(null)}
            onCancel={() => setEditingPatientId(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingPatient)}
        onClose={() => setDeletingPatient(null)}
        onConfirm={() => {
          if (!deletingPatient) return;
          deletePatient.mutate(deletingPatient.id, {
            onSettled: () => setDeletingPatient(null),
          });
        }}
        title="Delete patient?"
        description={`"${deletingPatient?.name}" will be removed from the directory; their payment history is kept. A patient with an active service or money owed can't be deleted until that is settled.`}
        confirmLabel="Delete"
        danger
        isLoading={deletePatient.isPending}
      />

      {canRegister && (
        <Modal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Register Patient"
          description="Enter the patient's details below. A unique Patient ID is generated automatically."
          className="max-w-2xl"
          dismissible={false}
        >
          <PatientRegistrationForm
            onSuccess={(patient) => {
              setIsModalOpen(false);
              router.push(`${basePath}/${patient.id}`);
            }}
            onCancel={() => setIsModalOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
}
