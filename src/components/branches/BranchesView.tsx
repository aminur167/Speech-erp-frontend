"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Users,
  Wallet,
  UserRound,
  Search,
  RefreshCw,
  Download,
  MapPin,
  Phone,
  Calendar,
  ChevronRight,
  Plus,
} from "lucide-react";
import { clsx } from "clsx";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { StatCard } from "@/components/dashboard/StatCard";
import { BranchForm } from "@/components/branches/BranchForm";
import { useBranchesOverview } from "@/hooks/branches/useBranchesOverview";
import { useCreateBranch } from "@/hooks/branches/useCreateBranch";
import { formatCurrency } from "@/utils/currency";
import { exportToCsv } from "@/utils/exportCsv";
import type { BranchStatus } from "@/types/domain";
import type { BranchInput } from "@/lib/api/branches";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function BranchesView() {
  const { data: overview, isLoading, isFetching, refetch } = useBranchesOverview();
  const createBranch = useCreateBranch();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BranchStatus | "">("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const totals = useMemo(() => {
    const list = overview ?? [];
    return {
      totalBranches: list.length,
      activeBranches: list.filter((item) => item.branch.status === "active").length,
      totalPatients: list.reduce((sum, item) => sum + item.patientCount, 0),
      monthlyRevenue: list.reduce((sum, item) => sum + item.monthlyRevenue, 0),
      totalStaff: list.reduce(
        (sum, item) => sum + item.branch.therapistCount + item.branch.supportCount,
        0,
      ),
    };
  }, [overview]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (overview ?? []).filter((item) => {
      if (statusFilter && item.branch.status !== statusFilter) return false;
      if (!query) return true;
      return (
        item.branch.name.toLowerCase().includes(query) ||
        item.branch.code.toLowerCase().includes(query) ||
        item.branch.address.toLowerCase().includes(query)
      );
    });
  }, [overview, search, statusFilter]);

  const hasFilters = Boolean(search || statusFilter);

  const handleCreate = (input: BranchInput) => {
    createBranch.mutate(input, { onSuccess: () => setIsCreateOpen(false) });
  };

  const handleExport = () => {
    exportToCsv(
      "branches.csv",
      filtered.map((item) => ({
        Code: item.branch.code,
        Name: item.branch.name,
        Status: item.branch.status,
        Patients: item.patientCount,
        Staff: item.branch.therapistCount + item.branch.supportCount,
        "Monthly Revenue": item.monthlyRevenue,
        Manager: item.branch.managerName,
        Phone: item.branch.phone,
        Address: item.branch.address,
        "Opened On": item.branch.openedAt,
      })),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref="/admin/dashboard"
        breadcrumb={["Admin", "Branches"]}
        title="Branch Management"
        subtitle="Manage all organization branches from one place."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExport} disabled={filtered.length === 0}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Branch
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Branches" value={String(totals.totalBranches)} icon={Building2} />
        <StatCard
          label="Active Branches"
          value={String(totals.activeBranches)}
          icon={CheckCircle2}
          tone="success"
          selected={statusFilter === "active"}
          onClick={() => setStatusFilter((prev) => (prev === "active" ? "" : "active"))}
        />
        <StatCard label="Total Patients" value={String(totals.totalPatients)} icon={Users} />
        <StatCard
          label="Monthly Revenue"
          value={formatCurrency(totals.monthlyRevenue)}
          icon={Wallet}
          tone="success"
        />
        <StatCard label="Total Staff" value={String(totals.totalStaff)} icon={UserRound} />
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search branch, code, or address…"
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as BranchStatus | "")}
            containerClassName="w-auto shrink-0"
            className="w-auto"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
              }}
              className="shrink-0 text-sm font-medium text-primary hover:underline"
            >
              Reset
            </button>
          )}
          <div className="ml-auto shrink-0">
            <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={clsx("h-4 w-4", isFetching && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {isLoading && (
        <Card>
          <LoadingState label="Loading branches…" />
        </Card>
      )}
      {!isLoading && filtered.length === 0 && (
        <Card>
          <EmptyState label="No branches match your filters." />
        </Card>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const staffTotal = item.branch.therapistCount + item.branch.supportCount;
            const isActive = item.branch.status === "active";
            return (
              <Link
                key={item.branch.id}
                href={`/admin/branches/${item.branch.id}`}
                className="group block"
              >
                <Card className="flex h-full flex-col gap-4 transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary">{item.branch.name}</p>
                        <p className="font-mono text-xs text-text-secondary">{item.branch.code}</p>
                      </div>
                    </div>
                    <Badge
                      tone={isActive ? "success" : "warning"}
                      label={isActive ? "Active" : "Inactive"}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-background p-3 text-center">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-text-secondary">
                        Patients
                      </p>
                      <p className="text-lg font-semibold text-text-primary">
                        {item.patientCount}
                      </p>
                    </div>
                    <div className="border-x border-border">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-text-secondary">
                        Staff
                      </p>
                      <p className="text-lg font-semibold text-text-primary">{staffTotal}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-text-secondary">
                        Revenue
                      </p>
                      <p className="text-lg font-semibold text-text-primary">
                        {formatCurrency(item.monthlyRevenue)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                        {item.branch.managerName.charAt(0)}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {item.branch.managerName}
                        </p>
                        <p className="text-xs text-text-secondary">Branch Manager</p>
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-[11px] text-text-secondary">
                      {item.branch.managerCode}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 text-sm text-text-secondary">
                    <span className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {item.branch.address}
                    </span>
                    <span className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {item.branch.phone}
                    </span>
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                    <span className="flex items-center gap-1.5 text-xs text-text-secondary">
                      <Calendar className="h-3.5 w-3.5" />
                      Since {formatDate(item.branch.openedAt)}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-medium text-primary">
                      View Live Details
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Branch"
        description="Add a new branch to the organization."
      >
        <BranchForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
          isSubmitting={createBranch.isPending}
          existingCodes={(overview ?? []).map((item) => item.branch.code)}
        />
      </Modal>
    </div>
  );
}
