"use client";

import { Building2, Users, Wallet } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/layout/PageHeader";
import { useBranchesOverview } from "@/hooks/branches/useBranchesOverview";
import { formatCurrency } from "@/utils/currency";

export function BranchesView() {
  const { data: overview, isLoading } = useBranchesOverview();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref="/admin/dashboard"
        breadcrumb={["Admin", "Branches"]}
        title="Branches"
        subtitle="Manage clinic branches and compare their performance."
      />

      <Card>
        {isLoading && <LoadingState label="Loading branches…" />}
        {!isLoading && (!overview || overview.length === 0) && (
          <EmptyState label="No branches configured yet." />
        )}
        {!isLoading && overview && overview.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary">
                  <th className="py-2 pr-4 font-medium">Branch</th>
                  <th className="py-2 pr-4 font-medium">Patients</th>
                  <th className="py-2 pr-4 font-medium">Total Collected</th>
                </tr>
              </thead>
              <tbody>
                {overview.map(({ branch, patientCount, totalCollected }) => (
                  <tr key={branch.id} className="border-b border-border last:border-0">
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary-light p-2 text-primary">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-text-primary">{branch.name}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-4">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-text-secondary" />
                        {patientCount}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <span className="inline-flex items-center gap-1.5">
                        <Wallet className="h-4 w-4 text-text-secondary" />
                        {formatCurrency(totalCollected)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
