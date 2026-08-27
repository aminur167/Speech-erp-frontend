"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/states";
import { ExpenseTable } from "@/components/expenses/ExpenseTable";
import { useExpenses } from "@/hooks/expenses/useExpenses";
import { useUpdateExpenseStatus } from "@/hooks/expenses/useUpdateExpenseStatus";
import { useAuthStore } from "@/store/authStore";
import type { ExpenseStatus } from "@/types/domain";

const PAGE_SIZE = 10;

export function ExpenseListView({ basePath }: { basePath: string }) {
  const user = useAuthStore((state) => state.user);
  const isManager = user?.role === "manager";
  const canCreate = isManager;
  const canApprove = user?.role === "admin";

  const [status, setStatus] = useState<ExpenseStatus | "">("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useExpenses({
    status: status || undefined,
    branchId: isManager ? (user?.branchId ?? undefined) : undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const updateStatus = useUpdateExpenseStatus();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-text-primary">Expenses</h1>
        {canCreate && (
          <Link href={`${basePath}/new`}>
            <Button>
              <Plus className="h-4 w-4" />
              Record Expense
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <Select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as ExpenseStatus | "");
            setPage(1);
          }}
          className="max-w-xs"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>

        <div className="mt-4">
          {isLoading && <LoadingState label="Loading expenses…" />}
          {isError && <ErrorState onRetry={() => refetch()} />}
          {!isLoading && !isError && data?.results.length === 0 && (
            <EmptyState label="No expenses found." />
          )}
          {!isLoading && !isError && data && data.results.length > 0 && (
            <>
              <ExpenseTable
                expenses={data.results}
                canApprove={canApprove}
                isMutating={updateStatus.isPending}
                onApprove={(id) => updateStatus.mutate({ id, status: "approved" })}
                onReject={(id) => updateStatus.mutate({ id, status: "rejected" })}
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
    </div>
  );
}
