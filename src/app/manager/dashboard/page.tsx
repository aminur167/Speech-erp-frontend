import { Users, Wallet, AlertCircle } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";

export default function ManagerDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-text-primary">Branch Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Today's Collection" value="৳15,500" icon={Wallet} />
        <StatCard label="Patients Registered" value="312" icon={Users} />
        <StatCard label="Total Due" value="৳8,500" icon={AlertCircle} />
      </div>
    </div>
  );
}
