import { PageHeader } from "@/components/layout/PageHeader";
import { MonthlyServiceEnrollment } from "@/components/services/MonthlyServiceEnrollment";

export default function MonthlyServicesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref="/manager/dashboard"
        breadcrumb={["Branch Manager", "Monthly Services"]}
        title="Monthly Services"
        subtitle="Enroll a patient into a recurring monthly package and manage bills."
      />
      <MonthlyServiceEnrollment />
    </div>
  );
}
