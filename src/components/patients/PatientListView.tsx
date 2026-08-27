"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/states";
import { PageHeader } from "@/components/layout/PageHeader";
import { PatientSearchInput } from "@/components/patients/PatientSearchInput";
import { PatientTable } from "@/components/patients/PatientTable";
import { PatientRegistrationForm } from "@/components/patients/PatientRegistrationForm";
import { usePatients } from "@/hooks/patients/usePatients";
import { useAuthStore } from "@/store/authStore";

const PAGE_SIZE = 10;

export function PatientListView({
  basePath,
  homeHref,
  roleLabel,
}: {
  basePath: string;
  homeHref: string;
  roleLabel: string;
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const canRegister = user?.role === "manager";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, isError, refetch } = usePatients({
    search,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref={homeHref}
        breadcrumb={[roleLabel, "Patients"]}
        title="Patients"
        subtitle="Manage patient records, registrations and profiles."
        action={
          canRegister && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Register Patient
            </Button>
          )
        }
      />

      <Card>
        <PatientSearchInput
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />

        <div className="mt-4">
          {isLoading && <LoadingState label="Loading patients…" />}
          {isError && <ErrorState onRetry={() => refetch()} />}
          {!isLoading && !isError && data?.results.length === 0 && (
            <EmptyState label="No patients found." />
          )}
          {!isLoading && !isError && data && data.results.length > 0 && (
            <>
              <PatientTable patients={data.results} basePath={basePath} />
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

      {canRegister && (
        <Modal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Register Patient"
          description="Enter the patient's details below. A unique Patient ID is generated automatically."
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
