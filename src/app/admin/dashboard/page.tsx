import { Building2, Users, Wallet, TrendingUp, Receipt } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { PageHeader } from "@/components/layout/PageHeader";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref="/admin/dashboard"
        breadcrumb={["Admin", "Dashboard"]}
        title="Dashboard"
        subtitle="Overview of clinic performance across all branches."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Branches" value="4" icon={Building2} />
        <StatCard label="Total Patients" value="1,284" icon={Users} />
        <StatCard label="Today's Collection" value="৳42,500" icon={Wallet} />
        <StatCard label="Total Due" value="৳45,500" icon={TrendingUp} tone="warning" />
        <StatCard label="Expenses (This Month)" value="৳97,200" icon={Receipt} tone="danger" />
      </div>
    </div>
  );
}
