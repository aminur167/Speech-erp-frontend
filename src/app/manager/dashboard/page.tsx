import { Users, Wallet, AlertCircle, Receipt } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { PageHeader } from "@/components/layout/PageHeader";

export default function ManagerDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref="/manager/dashboard"
        breadcrumb={["Branch Manager", "Dashboard"]}
        title="Dashboard"
        subtitle="Overview of your branch's daily performance."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's Collection" value="৳15,500" icon={Wallet} />
        <StatCard label="Patients Registered" value="312" icon={Users} />
        <StatCard label="Total Due" value="৳8,500" icon={AlertCircle} tone="warning" />
        <StatCard label="Expenses (This Month)" value="৳24,200" icon={Receipt} tone="danger" />
      </div>
    </div>
  );
}
