"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/states";
import { PatientSearchInput } from "@/components/patients/PatientSearchInput";
import { PatientTable } from "@/components/patients/PatientTable";
import { usePatients } from "@/hooks/patients/usePatients";

const PAGE_SIZE = 10;

export function PatientListView({
  basePath,
  canRegister,
}: {
  basePath: string;
  canRegister: boolean;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = usePatients({
    search,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-text-primary">Patients</h1>
        {canRegister && (
          <Link href={`${basePath}/new`}>
            <Button>
              <Plus className="h-4 w-4" />
              Register Patient
            </Button>
          </Link>
        )}
      </div>

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
    </div>
  );
}
